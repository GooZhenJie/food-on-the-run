import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { useCart } from '@/contexts/CartContext';
import type { IMenuCategoryRow, IMenuItemRow } from '@/services/menu';

interface IProps {
  categories: IMenuCategoryRow[];
  items: IMenuItemRow[];
  restaurantId: number;
  restaurantName: string;
}

const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

const MenuItem: React.FC<{ item: IMenuItemRow; restaurantId: number; restaurantName: string }> = ({
  item,
  restaurantId,
  restaurantName,
}) => {
  const { addItem } = useCart();
  const { message } = App.useApp();

  const handleAdd = () => {
    addItem(String(restaurantId), restaurantName, {
      menuItemId: String(item.id),
      name: item.name,
      imageUrl: item.image_url || '',
      priceAmount: item.price_amount,
    });
    message.success({ content: `${item.name} added`, duration: 1.5 });
  };

  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-semibold text-gray-900 leading-snug truncate">
          {item.name}
        </h4>
        {item.description && (
          <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="text-[15px] font-bold text-gray-900 mt-2">
          {formatPrice(item.price_amount)}
        </p>
      </div>

      <div className="relative shrink-0">
        {item.image_url && (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <button
          onClick={handleAdd}
          className={`${item.image_url ? 'absolute -bottom-2 left-1/2 -translate-x-1/2' : ''} w-8 h-8 bg-white border-2 border-orange-500 text-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-500 hover:text-white transition-all active:scale-90`}
        >
          <PlusOutlined className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export const MenuSection: React.FC<IProps> = ({ categories, items, restaurantId, restaurantName }) => {
  return (
    <div className="mt-6 space-y-6">
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        if (catItems.length === 0) return null;
        return (
          <section key={cat.id}>
            <div className="sticky top-14 z-10 bg-gray-50/95 backdrop-blur-sm py-3 px-1">
              <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
              <p className="text-xs text-gray-400">{catItems.length} items</p>
            </div>
            <div className="divide-y divide-gray-100">
              {catItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
