from core.orset import OrSet
from core.lwwregister import LWWRegister

class SharedDocument:

    def __init__(self, id:str):
        self.id = id
        self.nodes = OrSet()
        self.edges = OrSet()
        
        self.node_pos_x = dict()
        self.node_pos_y = dict()
        self.label = dict()
    
    def add_node(self, node_id, pos_x, pos_y, label):
        self.nodes.add(node_id)

        if node_id in self.node_pos_x:
            self.node_pos_x[node_id].set(pos_x)
        else:
            self.node_pos_x[node_id] = LWWRegister(pos_x)
        

        if node_id in self.node_pos_y:
            self.node_pos_x[node_id].set(pos_y)
        else:
            self.node_pos_y[node_id] = LWWRegister(pos_y)
        
        if node_id in self.label:
            self.label[node_id].set(label)
        else:
            self.label[node_id] = LWWRegister(label)
    
    def state_snapshot(self):
        state = {
            "id":self.id,
            "nodes": self.nodes.state_snapshot(),
            "edges": self.edges.state_snapshot(),
            "node_posx":dict(),
            "node_posy":dict(),
            "node_label":dict()
        }

        for key in self.node_pos_x.keys():
            state["node_posx"][key] = self.node_pos_x[key].state_snapshot()
        
        for key in self.node_pos_y.keys():
            state["node_posy"][key] = self.node_pos_y[key].state_snapshot()
        
        for key in self.label.keys():
            state["node_label"][key] = self.label[key].state_snapshot()
        
        return state
    
    def merge_state_snapshot(self, other):
        self.nodes.merge_state_snapshot(other['nodes'])
        self.edges.merge_state_snapshot(other['edges'])

        for key in other['node_posx']:
            if key in self.node_pos_x:
                self.node_pos_x[key].merge_state_snapshot(other['node_posx'][key])
            else:
                self.node_pos_x[key] = LWWRegister(other['node_posx'][key]['value'], other['node_posx'][key]['timestamp'])
        

        for key in other['node_posy']:
            if key in self.node_pos_y:
                self.node_pos_y[key].merge_state_snapshot(other['node_posy'][key])
            else:
                self.node_pos_y[key] = LWWRegister(other['node_posy'][key]['value'], other['node_posy'][key]['timestamp'])
        

        for key in other['node_label']:
            if key in self.label:
                self.label[key].merge_state_snapshot(other['node_label'][key])
            else:
                self.label[key] = LWWRegister(other['node_label'][key]['value'], other['node_label'][key]['timestamp'])
        