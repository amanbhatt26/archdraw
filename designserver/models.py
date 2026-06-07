from pydantic import BaseModel

class StateSnapshot(BaseModel):
    id:str
    nodes: dict[str,list[str]]
    edges: dict[str,list[str]]
    node_posx: dict[str, dict[str,str]]
    node_posy: dict[str, dict[str,str]]
    node_label: dict[str, dict[str, str]]