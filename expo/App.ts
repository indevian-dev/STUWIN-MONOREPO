import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { StudentSchema, type Student } from '@stuwin/shared';

export default function App() {
  const student: Student = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Bob Mobile',
    email: 'bob@stuwin.ai',
    grade: 11,
    isActive: true
  };

  const validationResult = StudentSchema.safeParse(student);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monorepo Test: Expo</Text>
      <Text>{JSON.stringify(student, null, 2)}</Text>
      <Text>Validation: {validationResult.success ? 'Success' : 'Failed'}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  }
});
