import { IRestaurantRow } from '@/services/restaurants';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Link } from 'umi';

export const RestaurantCard: React.FC<{ data: IRestaurantRow }> = ({
  data,
}) => {
  return (
    <Link
      to={`/restaurant-detail/${data.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <img
          src={
            data.image_url ||
            'https://placehold.co/400x240/f59e0b/fff?text=Restaurant'
          }
          alt={data.name}
          className="w-full h-44 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
          {data.name}
        </h3>
        {data.description && (
          <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">
            {data.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[13px] text-gray-600">
          <span className="flex items-center gap-1">
            <StarFilled className="text-amber-500" />
            <span className="font-semibold text-gray-800">4.7</span>
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <ClockCircleOutlined className="text-xs" />
            25 min
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-emerald-600 font-medium">Free delivery</span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-1.5 flex items-center gap-1">
          <EnvironmentOutlined />
          {data.address_line_1}, {data.city}
        </p>
      </div>
    </Link>
  );
};
