import { Edit, SimpleForm, TextInput, DateInput, NumberInput, ReferenceInput, SelectInput, required } from 'react-admin';

export const TransactionEdit = () => (
    <Edit mutationMode="pessimistic">
        <SimpleForm>
            <DateInput source="date" validate={[required()]} />
            <ReferenceInput source="categoryId" reference="categories">
                <SelectInput optionText="name" validate={[required()]} />
            </ReferenceInput>
            <TextInput source="description" />
            <NumberInput source="amount" validate={[required()]} />
        </SimpleForm>
    </Edit>
);
