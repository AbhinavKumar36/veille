import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))) # root

import json
import logging
import time
from confluent_kafka import Consumer, KafkaError, KafkaException
from core.config import settings
from core.database import SessionLocal
from ml.nlp.schemas import ExtractedGraph, ExtractedEntity, ExtractedRelation
from services.graph_service import insert_extracted_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("veille.kafka_consumer")

def process_cdr_message(msg_val: dict):
    case_id = msg_val.get("case_id")
    caller = msg_val.get("caller")
    receiver = msg_val.get("receiver")
    timestamp = msg_val.get("timestamp")
    duration_seconds = msg_val.get("duration_seconds")
    cell_tower_id = msg_val.get("cell_tower_id")
    source_evidence_id = msg_val.get("source_evidence_id", "kafka-stream")

    if not all([case_id, caller, receiver]):
        logger.warning(f"Invalid CDR message: {msg_val}")
        return

    caller_id = f"Phone_{caller}".replace(" ", "_").replace("-", "_")
    receiver_id = f"Phone_{receiver}".replace(" ", "_").replace("-", "_")

    entities = [
        ExtractedEntity(id=caller_id, label="Phone", name=caller, properties={}),
        ExtractedEntity(id=receiver_id, label="Phone", name=receiver, properties={})
    ]

    relationships = [
        ExtractedRelation(
            source_id=caller_id,
            target_id=receiver_id,
            type="COMMUNICATES_WITH",
            confidence=1.0,
            properties={
                "timestamp": timestamp,
                "duration_seconds": duration_seconds,
                "cell_tower_id": cell_tower_id
            }
        )
    ]

    extracted_graph = ExtractedGraph(entities=entities, relationships=relationships)
    
    db = SessionLocal()
    try:
        insert_extracted_graph(db, extracted_graph, source_evidence_id=source_evidence_id, case_id=case_id)
        db.commit()
        logger.info(f"Processed CDR {caller} -> {receiver}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to insert CDR outbox events: {e}")
    finally:
        db.close()

def run_consumer():
    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': settings.KAFKA_GROUP_ID,
        'auto.offset.reset': 'earliest'
    }

    logger.info(f"Connecting to Kafka at {settings.KAFKA_BOOTSTRAP_SERVERS}...")
    
    # Simple retry logic for broker availability
    while True:
        try:
            consumer = Consumer(conf)
            # Try to fetch metadata to ensure connection
            consumer.list_topics(timeout=5.0)
            break
        except Exception as e:
            logger.warning(f"Kafka not ready, retrying in 5s... ({e})")
            time.sleep(5)

    consumer.subscribe([settings.KAFKA_CDR_TOPIC])
    logger.info(f"Subscribed to topic {settings.KAFKA_CDR_TOPIC}")

    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    raise KafkaException(msg.error())
            
            try:
                msg_val = json.loads(msg.value().decode('utf-8'))
                process_cdr_message(msg_val)
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    except KeyboardInterrupt:
        logger.info("Stopping Kafka Consumer...")
    finally:
        consumer.close()

if __name__ == "__main__":
    run_consumer()
