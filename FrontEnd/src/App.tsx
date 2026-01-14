import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { CategoryList } from './categories/CategoryList';
import { CategoryCreate } from './categories/CategoryCreate';
import { CategoryEdit } from './categories/CategoryEdit';
import { TransactionList } from './transactions/TransactionList';
import { TransactionCreate } from './transactions/TransactionCreate';
import { TransactionEdit } from './transactions/TransactionEdit';
import myTheme from './theme';
import { MyLoginPage } from './pages/MyLoginPage';
import { Register } from './pages/Register';
import { MyLayout } from './layout/MyLayout';
import { Dashboard } from './pages/Dashboard';

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    theme={myTheme}
    loginPage={MyLoginPage}
    layout={MyLayout}
    dashboard={Dashboard}
  >
    <Resource name="categories" list={CategoryList} create={CategoryCreate} edit={CategoryEdit} />
    <Resource name="transactions" list={TransactionList} create={TransactionCreate} edit={TransactionEdit} />
    <CustomRoutes noLayout>
      <Route path="/register" element={<Register />} />
    </CustomRoutes>
  </Admin>
);

export default App
