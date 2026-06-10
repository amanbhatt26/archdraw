import axios from "axios";
import { useEffect, useState } from "react";

export const LandingPage = ()=>{
    const [designList, setDesignList] = useState<{id:string, name:string}[]>([]);

    const fetchDesignList = async ()=>{
        try{
        const {data} = await axios.get("http://localhost:8000/api/v1/designs")
        
        setDesignList(data.designs)
        }catch(error){
        console.log(error)
        }
    }
    
    useEffect(()=>{
        fetchDesignList()
    }, [])

    return <div>
        <ul>
            {designList.toSorted().map((element)=>{
                return <li key={element.id}><a href={`/designs/${element.id}`}>{element.name}</a></li>
            })}
        </ul>
    </div>
}