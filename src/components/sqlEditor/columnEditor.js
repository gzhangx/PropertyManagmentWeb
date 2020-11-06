import React, { useState, useEffect } from 'react';
import { Table, Form, DropdownButton, Dropdown, Button  } from 'react-bootstrap';
import { sqlGetTableInfo, sqlFreeForm } from '../api';
function ColumnPicker(props) {
    const defaultColumnTypeVal = { label: 'varchar', value: 'varchar' };
    const { isNew, table } = props;    
    const [tableInfo, setTableInfo] = useState({});    
    const [newColInfo, setNewColInfo] = useState({
        name: '',
        type: defaultColumnTypeVal,
        selType: 'varchar',
        size: 100,
    });
    const setSelType = selType => {
        setNewColInfo({
            ...newColInfo,
            selType,
        });
    }
    const getTableInfo = () => {
        if (table)
            sqlGetTableInfo(table).then(res => {
                setTableInfo({
                    constraints: res.constraints,
                    fields: res.fields.map(f => {
                        const r = f.fieldType.match(/([a-zA-Z]+)(\(([0-9]+){1,1}(,([0-9]+){1,1}){0,1}\)){0,1}/);
                        console.log(f.fieldType)
                        console.log(`${r[1]}  - ${r[3]} - ${r[5]}`);                        
                        return {
                            ...f,
                            fieldType: r[1],
                            fieldSize: r[3],
                            fieldMinSize: r[5], 
                        }; 
                    }),
                    indexes: res.indexes,
                });
            });
    }
    useEffect(() => {
        if (!isNew)
            getTableInfo();
    }, [table]);    
    return <div>
            {
            tableInfo && tableInfo.fields && <Table striped bordered hover size="sm">
                <thead>
                    <tr><td>Name</td><td>Type</td><td>Size</td><td>Action</td></tr>
                </thead>
                    <tbody>                                                
                        {                        
                            //tableInfo.fields.map(f => <div>{f.fieldName}</div>)
                        tableInfo.fields.map((f, key) => <tr key={key}><td style={{ textAlign: 'left' }}>{f.fieldName}</td><td style={{ textAlign: 'left' }}> {f.fieldType}</td>
                            <td>{f.fieldSize || ''}</td>
                            <td><Button onClick={() => {
                                if (isNew) {
                                    setTableInfo({
                                        ...tableInfo,
                                        fields: tableInfo.fields.filter(ff=>ff.fieldName !==f.fieldName)
                                    })
                                } else {
                                    sqlFreeForm(`alter table ${table} drop column ${f.fieldName};`).then(() => { 
                                        return getTableInfo();
                                    });
                                }
                            }}>Delete</Button></td>
                        </tr>)
                        }
                        <tr><td>                        
                        <Form.Control as="input" value={newColInfo.name} onChange={e => {
                                    setNewColInfo({
                                        ...newColInfo,
                                        name: e.target.value
                                    });
                                }}/>
                            </td>                                
                                <td>
                            <DropdownButton title={newColInfo.selType} >
                                <Dropdown.Item onSelect={() => setSelType('varchar')}>varchar</Dropdown.Item>
                                <Dropdown.Item onSelect={() => setSelType('datetime')}>datetime</Dropdown.Item>
                                <Dropdown.Item onSelect={() => setSelType('decimal')}>decimal</Dropdown.Item>
                            </DropdownButton>                                                                        
                                </td>
                        <td>
                            <Form.Control as="input" value={newColInfo.size} onChange={
                                e => {
                                    const v = parseInt(e.target.value);
                                    if (isNaN(v)) return;
                                    setNewColInfo({
                                        ...newColInfo,
                                        fieldSize: v,
                                    })
                                }
                            } />
                        </td>
                        <td>
                            <Button onClick={() => {
                                if (isNew) {
                                    if (newColInfo.name) {                                        
                                        setTableInfo({
                                            ...tableInfo,
                                            fields: tableInfo.fields.concat({
                                                fieldName: newColInfo.name,
                                                fieldType: newColInfo.selType,
                                                size: newColInfo.size,
                                            })
                                        })
                                    }
                                } else {
                                    if (newColInfo.name) {
                                        let fieldType = newColInfo.selType;
                                        if (fieldType === 'varchar') {
                                            fieldType = `${fieldType}(${newColInfo.size})`;
                                        }
                                        if (fieldType === 'decimal') {
                                            fieldType = `${fieldType}(${newColInfo.size},2)`;
                                        }
                                        sqlFreeForm(`alter table ${table} add column ${newColInfo.name} ${fieldType};`).then(() => {
                                            return getTableInfo();
                                        });
                                    }
                                }
                            }}>Add</Button>
                        </td>
                        </tr>
                        
                    </tbody>
                </Table>
            }
    </div>
}


export default ColumnPicker;