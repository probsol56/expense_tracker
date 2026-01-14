import { List, Datagrid, TextField, DateField, NumberField, ReferenceField, EditButton, DeleteButton } from 'react-admin';

export const TransactionList = () => (
    <List>
        <Datagrid rowClick="edit">
            <DateField source="date" />
            <ReferenceField source="categoryId" reference="categories">
                <TextField source="name" />
            </ReferenceField>
            <TextField source="description" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);
