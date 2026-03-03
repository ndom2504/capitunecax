import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryDark }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  return <Redirect href={user ? '/(tabs)/dashboard' : '/(auth)/connexion'} />;
}
