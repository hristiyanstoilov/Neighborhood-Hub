import type { ReactElement, ReactNode } from 'react'
import { ActivityIndicator, FlatList, type ListRenderItem, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { mobileTheme } from '../lib/theme'

type PagedListViewProps<T> = {
  data: readonly T[]
  keyExtractor: (item: T) => string
  renderItem: ListRenderItem<T>
  loading: boolean
  error: boolean
  errorMessage: string
  onRetry: () => void
  refreshing: boolean
  onRefresh: () => void
  onEndReached?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  listContentStyle: object
  emptyMessage: string
  listHeader?: ReactElement | null
  emptyComponent?: ReactElement | null
  itemSeparator?: ReactElement | null
  emptyAction?: ReactElement | null
  footer?: ReactElement | null
  footerLoaderColor?: string
}

export function PagedListView<T>({
  data,
  keyExtractor,
  renderItem,
  loading,
  error,
  errorMessage,
  onRetry,
  refreshing,
  onRefresh,
  onEndReached,
  hasMore,
  loadingMore,
  listContentStyle,
  emptyMessage,
  listHeader,
  emptyComponent,
  itemSeparator,
  emptyAction,
  footer,
  footerLoaderColor = mobileTheme.colors.primary,
}: PagedListViewProps<T>) {
  const staleDataError = error && data.length > 0

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={footerLoaderColor} size="large" />
      </View>
    )
  }

  if (error && data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Text onPress={onRetry} style={styles.retryText}>Retry</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={data as T[]}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={footerLoaderColor} />
      }
      contentContainerStyle={data.length === 0 ? styles.emptyContainer : listContentStyle}
      ListHeaderComponent={
        staleDataError || listHeader ? (
          <View>
            {staleDataError ? (
              <View style={styles.inlineError}>
                <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                <Text onPress={onRetry} style={styles.inlineRetryText}>Retry</Text>
              </View>
            ) : null}
            {listHeader}
          </View>
        ) : null
      }
      ListEmptyComponent={
        emptyComponent ?? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
            {emptyAction}
          </View>
        )
      }
      ItemSeparatorComponent={itemSeparator ? () => itemSeparator : undefined}
      ListFooterComponent={
        hasMore ? (
          footer ?? (
            loadingMore ? <ActivityIndicator color={footerLoaderColor} style={styles.footerLoader} /> : null
          )
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: mobileTheme.colors.textMuted,
    textAlign: 'center',
  },
  retryText: {
    color: mobileTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 15,
    color: mobileTheme.colors.textSubtle,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  inlineError: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mobileTheme.colors.statusDangerBg,
    backgroundColor: mobileTheme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12,
    color: mobileTheme.colors.statusDangerText,
  },
  inlineRetryText: {
    color: mobileTheme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
})