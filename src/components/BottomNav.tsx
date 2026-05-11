import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, BarChart2, Plus, Trophy, Bell } from 'lucide-react-native';
import { Screen } from '../store/useAppStore';
import { Radii } from '../theme/tokens';
import { makeStyles, useTheme } from '../theme/ThemeContext';

interface BottomNavProps {
  current: Screen;
  onNav: (screen: Screen) => void;
  onAdd: () => void;
}

const LEFT_TABS:  { screen: Screen; label: string; Icon: any }[] = [
  { screen: 'home',    label: 'Hoje',      Icon: Home },
  { screen: 'history', label: 'Histórico', Icon: BarChart2 },
];
const RIGHT_TABS: { screen: Screen; label: string; Icon: any }[] = [
  { screen: 'badges',    label: 'Troféus',   Icon: Trophy },
  { screen: 'reminders', label: 'Lembretes', Icon: Bell },
];

const useStyles = makeStyles(c => ({
  wrapper: { position: 'absolute' as const, bottom: 16, left: 16, right: 16, alignItems: 'center' as const },
  bar: {
    width: '100%' as const, flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: c.white, borderRadius: Radii.xl,
    paddingVertical: 10, paddingHorizontal: 8,
    shadowColor: c.ink, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center' as const, gap: 3, paddingVertical: 4, paddingHorizontal: 4, borderRadius: 14 },
  tabActive: { backgroundColor: c.teal50 },
  label: { fontSize: 10, fontWeight: '500' as const, color: c.inkMute },
  labelActive: { color: c.teal900, fontWeight: '700' as const },
  fabSpace: { width: 60 },
  fab: {
    position: 'absolute' as const, top: -22, width: 54, height: 54,
    borderRadius: Radii.md, backgroundColor: c.teal700,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    shadowColor: c.teal700, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
}));

export function BottomNav({ current, onNav, onAdd }: BottomNavProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        {LEFT_TABS.map(t => (
          <NavTab key={t.screen} {...t} active={current === t.screen} onPress={() => onNav(t.screen)} colors={colors} styles={styles} />
        ))}
        <View style={styles.fabSpace} />
        {RIGHT_TABS.map(t => (
          <NavTab key={t.screen} {...t} active={current === t.screen} onPress={() => onNav(t.screen)} colors={colors} styles={styles} />
        ))}
      </View>
      <TouchableOpacity style={styles.fab} onPress={onAdd} activeOpacity={0.85}>
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

function NavTab({ label, active, onPress, Icon, colors, styles }: {
  label: string; active: boolean; onPress: () => void; Icon: any; colors: any; styles: any;
}) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress} activeOpacity={0.75}>
      <Icon size={22} color={active ? colors.teal900 : colors.inkMute} strokeWidth={active ? 2.4 : 1.8} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
