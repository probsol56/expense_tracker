import { Edit, SimpleForm, TextInput, SelectInput, required } from 'react-admin';

export const CategoryEdit = () => (
    <Edit mutationMode="pessimistic">
        <SimpleForm>
            <TextInput source="name" validate={[required()]} />
            <TextInput source="description" multiline rows={3} />
            <SelectInput source="type" choices={[
                { id: 1, name: 'Income' },
                { id: 2, name: 'Expense' },
            ]} validate={[required()]} />
        </SimpleForm>
    </Edit>
);
