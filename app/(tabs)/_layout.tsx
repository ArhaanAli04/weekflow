import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue } from 'react-native';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName, outlineName: IoniconName) {
  return ({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) => <Ionicons name={focused ? name : outlineName} size={size} color={color as string} />;
}

export default function TabLayout() {
  const { session } = useAuthStore();
  if (!session) return <Redirect href="/(auth)/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.ACCENT,
        tabBarInactiveTintColor: COLORS.TEXT_MUTED,
        tabBarStyle: {
          backgroundColor: COLORS.BACKGROUND,
          borderTopColor: COLORS.BORDER,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'This Week',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: tabIcon('book', 'book-outline'),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: tabIcon('time', 'time-outline'),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon('trending-up', 'trending-up-outline'),
        }}
      />
    </Tabs>
  );
}
