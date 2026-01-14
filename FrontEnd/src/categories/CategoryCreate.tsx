import { Create, SimpleForm, TextInput, SelectInput, required } from 'react-admin';

export const CategoryCreate = () => (
    <Create redirect="list">
        <SimpleForm>
            <TextInput source="name" validate={[required()]} />
            <TextInput source="description" multiline rows={3} />
            <SelectInput source="type" choices={[
                { id: 1, name: 'Income' },
                { id: 2, name: 'Expense' },
            ]} validate={[required()]} />
        </SimpleForm>
    </Create>
);
