import { List, Datagrid, TextField, BooleanField, SelectField, EditButton, DeleteButton } from 'react-admin';

export const CategoryList = () => (
    <List>
        <Datagrid>
            <TextField source="name" />
            <TextField source="description" />
            <SelectField source="type" choices={[
                { id: 1, name: 'Income' },
                { id: 2, name: 'Expense' },
            ]} />
            <BooleanField source="isGlobal" />
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);
