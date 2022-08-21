import React, { Component, useState } from 'react';

function EditableInput(props){
    const [value, setValue] = useState('');

    return (
        <input
            type='text'
            value= {value}
            onChange={(e) => setValue(e.target.value)} 
            size = {50}

        />
    );

}

export default EditableInput;