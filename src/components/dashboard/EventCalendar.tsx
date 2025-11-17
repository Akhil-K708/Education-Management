import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export const EventCalendar = () => {
  const [activeTab, setActiveTab] = useState('Day');
  
  const markedDates = {
    '2025-11-16': { marked: true, dotColor: '#2563EB' },
    '2025-11-17': { selected: true, selectedColor: '#2563EB' },
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Event Calendar</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Day' && styles.activeTab]}
          onPress={() => setActiveTab('Day')}
        >
          <Text style={[styles.tabText, activeTab === 'Day' && styles.activeTabText]}>
            Day to day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Social' && styles.activeTab]}
          onPress={() => setActiveTab('Social')}
        >
          <Text style={[styles.tabText, activeTab === 'Social' && styles.activeTabText]}>
            Social Media
          </Text>
        </TouchableOpacity>
      </View>

      <Calendar
        current={'2025-11-17'}
        markedDates={markedDates}
        onDayPress={day => {
          console.log('selected day', day);
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#6B7280',
          selectedDayBackgroundColor: '#2563EB',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2563EB',
          dayTextColor: '#1F2937',
          textDisabledColor: '#D1D5DB',
          dotColor: '#2563EB',
          selectedDotColor: '#ffffff',
          arrowColor: '#1F2937',
          monthTextColor: '#111827',
          indicatorColor: '#2563EB',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 15,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  calendar: {
    borderRadius: 8,
  },
});