import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useApp } from '../../context/AppContext';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { format } from 'date-fns';
import { TextInput } from 'react-native-gesture-handler';
import { useThemeColor } from '../../hooks/useThemeColor';

export const FirstTimeConferencePrompt: React.FC = () => {
  const { createConference } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // Default to 3 days
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');

  const handleCreateConference = async () => {
    if (!name.trim()) {
      setError('Conference name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createConference(name, startDate, endDate, location);
      
      // The conference creation will redirect automatically or be handled by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conference');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDisplayDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };
  
  const formatCalendarDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.welcomeSection}>
          <Ionicons name="calendar" size={40} color={tintColor} style={styles.icon} />
          <ThemedText style={styles.title}>Welcome to Conpanion!</ThemedText>
          <ThemedText style={styles.description}>
            Let's set up your first conference to get started. Later, you can create more conferences and switch between them.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.formSection}>
          <ThemedText style={styles.label}>Conference Name *</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: backgroundColor }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter conference name"
            placeholderTextColor={placeholderColor}
          />
          
          <ThemedText style={styles.label}>Location (Optional)</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: backgroundColor }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter conference location"
            placeholderTextColor={placeholderColor}
          />
          
          <ThemedText style={styles.label}>Date Range *</ThemedText>
          
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: backgroundColor }]} 
            onPress={() => {
              setShowStartCalendar(!showStartCalendar);
              setShowEndCalendar(false);
            }}
          >
            <ThemedText>Start: {formatDisplayDate(startDate)}</ThemedText>
            <Ionicons name="calendar-outline" size={20} color={textColor} />
          </TouchableOpacity>
          
          {showStartCalendar && (
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  const selectedDate = new Date(day.timestamp);
                  setStartDate(selectedDate);
                  
                  // If end date is before start date, adjust it
                  if (endDate < selectedDate) {
                    // Set end date to start date + 1 day
                    const newEndDate = new Date(selectedDate);
                    newEndDate.setDate(newEndDate.getDate() + 1);
                    setEndDate(newEndDate);
                  }
                  
                  setShowStartCalendar(false);
                }}
                markedDates={{
                  [formatCalendarDate(startDate)]: { selected: true, selectedColor: tintColor }
                }}
                theme={{
                  todayTextColor: tintColor,
                  selectedDayBackgroundColor: tintColor,
                  arrowColor: tintColor,
                }}
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: backgroundColor }]} 
            onPress={() => {
              setShowEndCalendar(!showEndCalendar);
              setShowStartCalendar(false);
            }}
          >
            <ThemedText>End: {formatDisplayDate(endDate)}</ThemedText>
            <Ionicons name="calendar-outline" size={20} color={textColor} />
          </TouchableOpacity>
          
          {showEndCalendar && (
            <View style={styles.calendarContainer}>
              <Calendar
                minDate={formatCalendarDate(startDate)}
                onDayPress={(day) => {
                  setEndDate(new Date(day.timestamp));
                  setShowEndCalendar(false);
                }}
                markedDates={{
                  [formatCalendarDate(endDate)]: { selected: true, selectedColor: tintColor }
                }}
                theme={{
                  todayTextColor: tintColor,
                  selectedDayBackgroundColor: tintColor,
                  arrowColor: tintColor,
                }}
              />
            </View>
          )}
          
          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: tintColor, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleCreateConference}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create My First Conference'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.tipsSection}>
          <ThemedText style={styles.tipsTitle}>What's Next?</ThemedText>
          <View style={styles.tipItem}>
            <Ionicons name="mic-outline" size={20} color={tintColor} style={styles.tipIcon} />
            <ThemedText style={styles.tipText}>Create talks for your sessions</ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="document-text-outline" size={20} color={tintColor} style={styles.tipIcon} />
            <ThemedText style={styles.tipText}>Take notes during each talk</ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="camera-outline" size={20} color={tintColor} style={styles.tipIcon} />
            <ThemedText style={styles.tipText}>Add images and audio recordings</ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="share-outline" size={20} color={tintColor} style={styles.tipIcon} />
            <ThemedText style={styles.tipText}>Export your conference notes</ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  calendarContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
  createButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsSection: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    fontSize: 16,
  },
});