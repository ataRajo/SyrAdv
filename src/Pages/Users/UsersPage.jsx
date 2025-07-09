 import UsersContainer from '../../Components/Users/UsersContainer';
import HeaderComponent from '../../utils/HeaderComponent';
import { DialogAddUser } from '../../utils/Dialogs/EditAddDialog/Add/DialogAddUser';
 import useSearch from '../../hooks/useSearch';
 import { Permissions } from '../../Static/StaticData';
import useUsers from '../../hooks/useUsers';

const UsersPage = () => {
const {users , isSuccess , setOpen , open , isFetchingUsers} = useUsers()
  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    isSuccess ? users : [],
    'username'
  );

  return (
    <div>
      <HeaderComponent title={'الموظفين'} permission={Permissions.CreateUsers} titleBtn={'إضافة موظف'} setShow={setOpen} />
      <div className="p-4" dir="rtl">
        <input
          type="text"
          placeholder="ابحث عن موظف باسم المستخدم"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <UsersContainer users={filteredData} isFetching={isFetchingUsers} />
      <DialogAddUser show={open} handleClose={() => setOpen(false)} />
    </div>
  );
};

export default UsersPage;