import { Card, Statistic } from 'antd';
import {
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Overview</h1>
        <p className="text-sm text-gray-500">
          Operational snapshot of the FOTR platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <Statistic
            title="Active restaurants"
            value={0}
            prefix={<ShopOutlined className="text-orange-500" />}
          />
        </Card>
        <Card>
          <Statistic
            title="Orders today"
            value={0}
            prefix={<ShoppingCartOutlined className="text-orange-500" />}
          />
        </Card>
        <Card>
          <Statistic
            title="Active users"
            value={0}
            prefix={<TeamOutlined className="text-orange-500" />}
          />
        </Card>
        <Card>
          <Statistic
            title="GMV today"
            value={0}
            precision={2}
            prefix={<DollarOutlined className="text-orange-500" />}
          />
        </Card>
      </div>
    </div>
  );
}
