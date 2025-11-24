import React, { useEffect } from 'react'
import { DynamicTable } from '../../utils/Tables/DynamicTable'
import HeaderComponent from '../../utils/HeaderComponent'
import { BrokersColumns, BrokersCustomerColumns } from '../../utils/Tables/ColumnsTable/BrokersColumns'
import { useGetBrokersActivitiesQuery } from '../../RtkQuery/Slice/Brokers/BrokersApi'
import { useNavigate, useParams } from 'react-router'
import { BookingColumns } from '../../utils/Tables/ColumnsTable/BookingColumns'
import { Permissions } from '../../Static/StaticData'
import { Loader } from 'lucide-react'
import { PaymentsColumns } from '../../utils/Tables/ColumnsTable/PaymentsColumns'

const BrokerInfo = () => {
    const { id } = useParams()
    const { data: brokersActivitiesQuery, isFetching, isLoading } = useGetBrokersActivitiesQuery(id);
    const navigate = useNavigate()
    useEffect(() => { }, [id])
    console.log(brokersActivitiesQuery)

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center">
                <Loader />
                <p>جاري التحميل ...</p>
            </div>
        );
    }
    return (
        <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
            <HeaderComponent
                title={"الزبائن "}
            />
            <DynamicTable
                data={brokersActivitiesQuery?.data?.customers || []}
                columns={BrokersCustomerColumns}
                isLoading={isFetching}
                onShow={(row) => navigate(`/dashboard/customers/${row.id}`)}
                permissions={{ show: Permissions.ViewBookings }}
            />

            <HeaderComponent
                title={"المدفوعات "}
            />
            <DynamicTable
                data={ brokersActivitiesQuery?.data?.payments || []}
                columns={PaymentsColumns}
            />

            <HeaderComponent
                title={"الحجوزات "}
            />
            <DynamicTable
                data={brokersActivitiesQuery?.data?.bookings || []}
                columns={BookingColumns}
                isLoading={isFetching}
                onShow={(row) => navigate(`/dashboard/booking/${row.id}`)}
                permissions={{ show: Permissions.ViewBookings }}
            />

        </div>
    )
}

export default BrokerInfo