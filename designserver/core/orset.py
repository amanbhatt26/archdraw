import shortuuid

class OrSet:
    def __init__(self):
        self.added = set()
        self.removed = set()
    
    def lookup(self, element:str):
        for elem in self.added.difference(self.removed):
            if elem.split("||")[0] == element:
                return True
        return False
    
    def snapshot(self):
        result = set()
        for elem in self.added.difference(self.removed):
            result.add(elem.split("||")[0])
        return result
    
    def add(self, element):
        self.added.add(element + "||" + shortuuid.uuid())
    
    def remove(self, element):
        if not self.lookup(element):
            return False
        
        subtraction_set = set()
        for elem in self.added:
            if elem.split("||")[0] == element:
                subtraction_set.add(elem)
        
        self.added.difference_update(subtraction_set)
        self.removed.update(subtraction_set)
    
    def merge(self, other:OrSet):
        self.added.update(other.added)
        self.removed.update(other.removed)
    

    def state_snapshot(self):
        return {
            "added": list(self.added),
            "removed": list(self.removed)
        }
    
    def merge_state_snapshot(self, other):
        for elem in other['added']:
            self.added.add(elem)
        for elem in other['removed']:
            self.removed.add(elem)
