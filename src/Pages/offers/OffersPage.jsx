import { useOffers } from "../../hooks/useOffers";
import HeaderComponent from "../../utils/HeaderComponent";
import OffersSearchFilter from "../../Components/Offers/OffersSearchFilter";
import OffersTable from "../../Components/Offers/OffersTable";
import OfferModal from "../../Components/Offers/OfferModal";
import { Permissions } from "../../Static/StaticData";

const OffersPage = () => {
  const {
    offers,
    isLoading,
    isFetching,
    showModal,
    editingOffer,
    isSubmitting,
    filters,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleToggleStatus,
    handleSearch,
    handleActiveFilter,
    handleExpiredFilter,
    handleWorkTypeFilter,
    clearFilters,
    refetch,
  } = useOffers();

  return (
    <div className="p-4 space-y-4 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header with Add Button */}
      <HeaderComponent
        setShow={openCreateModal}
        title="العروض"
        titleBtn="إضافة عرض جديد"
        permission={Permissions.ViewRegions}
      />

      {/* Search & Filters */}
      <OffersSearchFilter
        search={filters.search}
        active={filters.active}
        expired={filters.expired}
        workTypeId={filters.work_type_id}
        onSearch={handleSearch}
        onActiveChange={handleActiveFilter}
        onExpiredChange={handleExpiredFilter}
        onWorkTypeChange={handleWorkTypeFilter}
        onClear={clearFilters}
      />

      {/* Table */}
      <OffersTable
        offers={offers}
        isLoading={isLoading}
        isFetching={isFetching}
        onDelete={handleDelete}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modal */}
      {showModal && (
        <OfferModal
          show={showModal}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialData={editingOffer}
        />
      )}
    </div>
  );
};

export default OffersPage;