import { Create, SimpleForm, TextInput, DateInput, NumberInput, ReferenceInput, SelectInput, required } from 'react-admin';

export const TransactionCreate = () => (
    <Create redirect="list">
        <SimpleForm>
            <DateInput source="date" defaultValue={new Date()} validate={[required()]} />
            <ReferenceInput source="categoryId" reference="categories">
                <SelectInput optionText="name" validate={[required()]} />
            </ReferenceInput>
            <TextInput source="description" />
            <NumberInput source="amount" validate={[required()]} />
        </SimpleForm>
    </Create>
);
