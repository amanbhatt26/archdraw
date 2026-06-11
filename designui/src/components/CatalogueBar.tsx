export const CatalogueBar = ({dragStart, dragStop}:{dragStart:(event:any)=>void, dragStop:(event:any)=>void, })=>{

    return <div> 
        <button draggable onDragEnd={(event)=>dragStop(event)} onDragStart={(event)=>{dragStart(event)}} style={{"background":"white"}}> node </button>
    </div>
}