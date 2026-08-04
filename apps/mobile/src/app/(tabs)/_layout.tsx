import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors, typography } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon = (name: IconName, activeName: IconName) =>
  function TabIcon({
    color,
    focused,
    size,
  }: {
    color: React.ComponentProps<typeof Ionicons>['color'];
    focused: boolean;
    size: number;
  }) {
    return <Ionicons color={color} name={focused ? activeName : name} size={size} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: {
          fontFamily: typography.bodyMedium,
          fontSize: 11,
          marginBottom: 3,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana sayfa',
          tabBarAccessibilityLabel: 'Ana sayfa sekmesi',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Şablonlar',
          tabBarAccessibilityLabel: 'Şablonlar sekmesi',
          tabBarIcon: tabIcon('grid-outline', 'grid'),
        }}
      />
      <Tabs.Screen
        name="invitations"
        options={{
          title: 'Davetlerim',
          tabBarAccessibilityLabel: 'Davetlerim sekmesi',
          tabBarIcon: tabIcon('mail-outline', 'mail'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel: 'Profil sekmesi',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tabs>
  );
}
