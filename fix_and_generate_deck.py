import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
import os
import shutil

src_file = "d:/project/Crimenet/CN v1.pptx"
dst_file = "d:/project/Crimenet/SIH2026_VEILLE_AI_Official_Format.pptx"

# Load the user's presentation
prs = Presentation(src_file)

# Let's inspect each slide and make sure all text is clean, replacing any corrupt '?' characters with proper typography (-, ->, -, etc.)
replacements = {
    "Problem Statement ID ? SIH26189": "Problem Statement ID: SIH26189",
    "Team Name ? Team Void": "Team Name: Team Void",
    " ? Innovation": " - Innovation",
    "?risk scores?": "'risk scores'",
    "?Graph-DB + LLM?": "'Graph-DB + LLM'",
    "?candidate?": "'candidate'",
    "? defensible for": "- defensible for",
    "? confirming": "- confirming",
    "? Neo4j": "- Neo4j",
    "Postgres ? Neo4j": "Postgres -> Neo4j",
    "stack ? FastAPI": "stack - FastAPI",
    "mission ? 15,000+": "mission - 15,000+",
    "lock-in.": "lock-in.",
    "scores ? human": "scores - human",
    "burden.": "burden.",
    "demo.": "demo.",
    "? but are complex": "- but are complex",
    "?  IBM": "-  IBM",
    "?  Generic": "-  Generic",
    "Palantir Gotham  ?  IBM": "Palantir Gotham  |  IBM",
    "Notebook  ?  Generic": "Notebook  |  Generic",
    "scores ? human review gates every decision": "scores - human review gates every decision"
}

for slide in prs.slides:
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                for r in p.runs:
                    for old_str, new_str in replacements.items():
                        if old_str in r.text:
                            r.text = r.text.replace(old_str, new_str)
                    # Also replace any remaining rogue question marks in known phrases
                    r.text = r.text.replace(" ? ", " - ")
        elif shape.shape_type == pptx.enum.shapes.MSO_SHAPE_TYPE.GROUP:
            for child in shape.shapes:
                if child.has_text_frame:
                    for p in child.text_frame.paragraphs:
                        for r in p.runs:
                            r.text = r.text.replace(" ? ", " - ")

# Save the polished deck
prs.save(dst_file)
print(f"Successfully generated clean presentation at: {dst_file}")
