import { useParams } from "react-router-dom";

function ThreadDetail({ threads }){
    const { id } = useParams();
    const thread = threads[id];

    if (!thread) return <div> Thread not found </div>

    return (
        <div style={{padding:"20px"}}>
            <h2>{thread.title}</h2>
            <p>{thread.content}</p>
        </div>
    );
}

export default ThreadDetail;