import { generate } from "short-uuid";
export class OrSet{
    added:Set<string>
    removed:Set<string>

    constructor(){
        this.added = new Set();
        this.removed = new Set();
    }

    lookup(element:string):boolean {
        for(const elem of this.added){
            if(elem.split("||")[0] == element){
                if(!this.removed.has(elem)) return true;
            }
        }
        return false;
    }

    snapshot():Set<string>{

        const result = new Set<string>()
        for(const item of this.added){
            if(!this.removed.has(item)){
                result.add(item.split("||")[0])
            }
        }
        return result
    }

    add(element:string){
        this.added.add(element + "||" + generate())
    }

    remove(element:string):void{
        if(!this.lookup(element)){
            return
        }

        const subtractionSet = new Set<string>()
        for(const elem of this.added){
            if(elem.split("||")[0] === element){
                subtractionSet.add(elem)
            }
        }


        for(const elem of subtractionSet){
            this.added.delete(elem)
            this.removed.add(elem)
        }
    }


    merge(other:OrSet){
        for(const item of other.added){
            this.added.add(item)
        }

        for(const item of other.removed){
            this.removed.add(item)
        }
    }

    deepcopy():OrSet{
        let other = new OrSet()
        
        for(const item of this.added){
            other.added.add(item)
        }

        for(const item of this.removed){
            other.removed.add(item)
        }

        return other
    }

    stateSnapshot(): { added: string[]; removed: string[] } {
        return {
            added: Array.from(this.added),
            removed: Array.from(this.removed)
        };
    }

    mergeStateSnapshot(other: { added: string[]; removed: string[] }): void {
        for (const elem of other.added) {
            this.added.add(elem);
        }

        for (const elem of other.removed) {
            this.removed.add(elem);
        }
    }
}