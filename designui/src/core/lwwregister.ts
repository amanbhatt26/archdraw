function nextTimestamp(): string {
    return Date.now().toString();
}

export class LWWRegister<T>{
    value:T
    timestamp:string
    counter:number

    constructor(initial:T, timestamp:string = nextTimestamp() + "-0"){
        this.value = initial;
        this.timestamp = timestamp;
        this.counter = 1;
    }

    get():T{
        return this.value;
    }

    set(value:T){
        this.timestamp = nextTimestamp() + "-" + this.counter.toString();
        this.value = value;
        this.counter += 1;
    }

    merge(other:LWWRegister<T>){
        if (this.timestamp <= other.timestamp){
            this.timestamp = other.timestamp;
            this.value = other.value;
        }
    }

    stateSnapshot():{value:T; timestamp:string}{
        return {
            value:this.value,
            timestamp:this.timestamp
        }
    }

    mergeStateSnapshot(other:{value:T; timestamp:string}){
        if(this.timestamp <= other.timestamp){
            this.timestamp = other.timestamp;
            this.value = other.value;
        }
    }
    
}