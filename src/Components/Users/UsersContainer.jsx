import UserCard from './UserCard';
import LoadingGet from '../../utils/Loading/LoadingGet/LoadingGet';


const UsersContainer = ({ users, isFetching }) => {
  const SuperAdminInfo = JSON.parse(localStorage.getItem("SuperAdminInfo")) || {};
  const currentUserId = SuperAdminInfo?.user?.id;

  const filteredUsers = users.filter((user) => user.id !== currentUserId);

  if (isFetching) {
    return (
      <div className="w-full h-full flex-col flex justify-center items-center">
        <LoadingGet />
        <p>جاري التحميل ...</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 p-2 lg:grid-cols-4 gap-4"
      dir="rtl"
    >
      {filteredUsers.map((user) => (
        <UserCard
          key={user.id}
          id={user.id}
          full_name={user.full_name}
          username={user.username}
          phone_number={user.phone_number}
          address={user.address}
          email={user.email}
          roles={user.roles}
          created_at={user.created_at}
          updated_at={user.updated_at}
        />
      ))}
    </div>
  );
};

export default UsersContainer;