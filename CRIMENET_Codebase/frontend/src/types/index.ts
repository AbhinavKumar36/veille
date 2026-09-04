export interface User {
  id: string;
  email: string;
  role: 'INVESTIGATOR' | 'SUPERVISOR' | 'AUDITOR' | 'ADMIN';
}

export interface Case {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  primary_investigator_id: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: 'Person' | 'Phone' | 'Account' | 'Vehicle' | 'Organization' | 'Location' | 'Event';
  name: string;
  case_id: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source_id: string;
  target_id: string;
  type: 'ASSOCIATED_WITH' | 'OWNS' | 'COMMUNICATES_WITH' | 'LOCATED_AT' | 'PARTICIPATED_IN';
  confidence: number;
  source_evidence_id: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}
