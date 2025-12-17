import React from "react";
import { useParams } from "react-router-dom";

const AddPublication = () => {
    const { dep_id } = useParams();

    return (
        <>
            <h1>ADD PUBLICATION {dep_id}</h1>
        </>
    )
}

export default AddPublication;