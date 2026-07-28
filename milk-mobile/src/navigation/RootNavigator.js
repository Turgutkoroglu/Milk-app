import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { registerForPushNotifications } from '../notifications/registerForPushNotifications';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import NewOrderScreen from '../screens/customer/NewOrderScreen';
import SubscriptionScreen from '../screens/customer/SubscriptionScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import InfoScreen from '../screens/InfoScreen';

import ProducerHomeScreen from '../screens/producer/ProducerHomeScreen';
import ReportsScreen from '../screens/producer/ReportsScreen';
import ProducerCustomersScreen from '../screens/producer/ProducerCustomersScreen';
import SettingsScreen from '../screens/producer/SettingsScreen';

const AuthStack = createNativeStackNavigator();
const CustomerTabs = createBottomTabNavigator();
const ProducerTabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function CustomerNavigator() {
  const { theme } = useTheme();
  return (
    <CustomerTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}
    >
      <CustomerTabs.Screen
        name="Sipariş Ver"
        component={NewOrderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bottle-tonic-outline" size={size} color={color} />
          ),
        }}
      />
      <CustomerTabs.Screen
        name="Abonelik"
        component={SubscriptionScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-sync-outline" size={size} color={color} />
          ),
        }}
      />
      <CustomerTabs.Screen
        name="Geçmiş"
        component={OrderHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <CustomerTabs.Screen
        name="Bilgi"
        component={InfoScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="information-outline" size={size} color={color} />
          ),
        }}
      />
      <CustomerTabs.Screen
        name="Profil"
        component={CustomerProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </CustomerTabs.Navigator>
  );
}

function ProducerNavigator() {
  const { theme } = useTheme();
  return (
    <ProducerTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}
    >
      <ProducerTabs.Screen
        name="Siparişler"
        component={ProducerHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} />
          ),
        }}
      />
      <ProducerTabs.Screen
        name="Rapor"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <ProducerTabs.Screen
        name="Müşteriler"
        component={ProducerCustomersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
      <ProducerTabs.Screen
        name="Ayarlar"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </ProducerTabs.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme, scheme } = useTheme();

  useEffect(() => {
    if (user) {
      registerForPushNotifications().catch((err) =>
        console.log('Push kaydi basarisiz:', err.message)
      );
    }
  }, [user]);

  if (loading) return null;

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'producer' ? (
        <ProducerNavigator />
      ) : (
        <CustomerNavigator />
      )}
    </NavigationContainer>
  );
}
