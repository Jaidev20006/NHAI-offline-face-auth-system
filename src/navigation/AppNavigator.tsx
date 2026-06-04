import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import EnrollScreen from '../screens/EnrollScreen';
import AttendanceLogScreen from '../screens/AttendanceLogScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import AdminScreen from '../screens/AdminScreen';

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Enroll: undefined;
  AttendanceLog: undefined;
  Analytics: undefined;
  Security: undefined;
  Admin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { colors, theme } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0A1628' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          cardStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Identity Verification', headerStyle: { backgroundColor: '#000' } }} />
        <Stack.Screen name="Enroll" component={EnrollScreen} options={{ title: 'Enroll Employee' }} />
        <Stack.Screen name="AttendanceLog" component={AttendanceLogScreen} options={{ title: 'Attendance Log' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="Security" component={SecurityScreen} options={{ title: 'Security Dashboard' }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Dashboard' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
