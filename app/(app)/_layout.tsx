import { Slot, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navbar } from '../../src/components/navigation/Navbar';
import { Sidebar } from '../../src/components/navigation/Sidebar';

export default function AppLayout() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = width < 768;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleNavigate = (path: string) => {
    router.push(path as any);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  if (isWeb && !isMobile) {
    const sidebarWidth = isSidebarOpen ? 260 : 80;

    return (
      <View style={styles.webRootContainer}>
        <Navbar onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)} />
        <View style={styles.webBody}>
          <View style={[styles.sidebarContainer, { width: sidebarWidth }]}>
            <Sidebar onNavigate={handleNavigate} isOpen={isSidebarOpen} />
          </View>
          <ScrollView style={styles.pageContent}>
            <Slot />
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mobileRootContainer}>
      <Modal
        transparent={true}
        visible={isMobileMenuOpen}
        animationType="fade"
        onRequestClose={() => setIsMobileMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMobileMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSidebarContainer}>
                <Sidebar onNavigate={handleNavigate} isOpen={true} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.mobileContentContainer}>
        <Navbar onMenuPress={() => setIsMobileMenuOpen(true)} />
        <ScrollView style={styles.pageContent}>
          <Slot />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webRootContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F3F4F6',
  },
  webBody: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    height: '100%',
    zIndex: 1,
    ...Platform.select({
      web: {
        transitionProperty: 'width',
        transitionDuration: '300ms',
      } as any,
    }),
  },
  mobileRootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileContentContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSidebarContainer: {
    width: 280,
    height: '100%',
    backgroundColor: '#111827',
  },
  pageContent: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 10,
    backgroundColor: '#F3F4F6',
  },
});