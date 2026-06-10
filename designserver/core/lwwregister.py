import time
def next_timestamp():
    return str(int(time.time() * 1000))

class LWWRegister:
    def __init__(self, initial, timestamp:str = next_timestamp() + "-0"):
        self.value = initial
        self.timestamp = timestamp
        self.counter = 1
    
    def get(self):
        return self.value
    
    def set(self, value):
        self.timestamp = next_timestamp() + "-" + str(self.counter)
        self.value = value
        self.counter += 1
    
    def merge(self, other:LWWRegister):
        if self.timestamp <= other.timestamp:
            self.timestamp = other.timestamp
            self.value = other.value
    
    def state_snapshot(self):
        return {"value":self.value, "timestamp":self.timestamp}
    
    def merge_state_snapshot(self, other):
        if self.timestamp <= other['timestamp']:
            self.timestamp = other['timestamp']
            self.value = other['value']