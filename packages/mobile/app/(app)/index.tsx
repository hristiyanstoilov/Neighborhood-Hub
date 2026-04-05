import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth'
import { apiFetch } from '../../lib/api'
import SkillCard from '../../components/SkillCard'

interface Skill {
  id: string
  title: string
  status: string
  ownerName: string | null
  category: string | null
}

type FetchState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'ok'; skills: Skill[] }

export default function SkillListScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ type: 'loading' })
  const [refreshing, setRefreshing] = useState(false)

  const fetchSkills = useCallback(async () => {
    try {
      const res = await apiFetch('/api/skills?limit=30')
      if (!res.ok) {
        setState({ type: 'error', message: 'Failed to load skills.' })
        return
      }
      const json = await res.json()
      const rows = (json.data ?? []) as Array<{
        id: string
        title: string
        status: string
        ownerName: string | null
        categoryLabel: string | null
      }>
      const skills: Skill[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        ownerName: r.ownerName,
        category: r.categoryLabel,
      }))
      setState({ type: 'ok', skills })
    } catch {
      setState({ type: 'error', message: 'Network error. Please try again.' })
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchSkills()
    setRefreshing(false)
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Skills</Text>
        {user ? (
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (state.type === 'loading') {
    return (
      <View style={styles.center}>
        {renderHeader()}
        <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 40 }} />
      </View>
    )
  }

  if (state.type === 'error') {
    return (
      <View style={styles.center}>
        {renderHeader()}
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSkills}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.skills}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <SkillCard
            title={item.title}
            ownerName={item.ownerName}
            category={item.category}
            status={item.status}
            onPress={() => router.push(`/(app)/skills/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No skills found.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#15803d" />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  center: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  list: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  logoutText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
})
