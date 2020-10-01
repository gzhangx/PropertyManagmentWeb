import React  from 'react';
import GenList from './GenList';

function LeaseList() {  
    return <GenList table={'leaseInfo'}
    processForeignKey={
        (fk, datas) => {
            return datas.map(data => {
                return {
                    value: data[fk.field],
                    label: data['address'] + ' ' + data['ownerID'],
            }
        })
    }
}
displayFields={
        //actualy don't need to do this
        [
            { field: 'deposit', desc: 'Deposit',  },
            { field: 'endDate', desc: 'End Date', },
            { field: 'startDate', desc: 'Start Date',  },
            { field: 'houseAddress', desc: 'House'},
            { field: 'comment', desc: 'Comment' },
            { field: 'monthlyRent', desc: 'Monthly Rent' },
            //{field: 'ownerID',desc: 'Owner ID',require: true,foreignKey: {table: 'ownerInfo',field: 'ownerID'}},
        ]
    }
    loadMapper={
        (type,fields) => {
            if(type==='fields') {
                return fields;
            }
            if(type==='joins') {
                return {
                    'houseInfo': {
                        address: 'houseAddress',
                        ownerID: 'ownerID',
                    }
                }
            }
        }
    }
        title={'Lease List'} /> 
}

export default LeaseList;