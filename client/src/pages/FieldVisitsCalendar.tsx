import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Calendar as CalendarIcon, AlertTriangle, Clock, MapPin, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROGRAM_LABELS } from "../../../shared/constants";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

const PROGRAM_COLORS: Record<string, string> = {
  bunyan: "bg-blue-500",
  daaem: "bg-green-500",
  enaya: "bg-purple-500",
  emdad: "bg-orange-500",
  ethraa: "bg-pink-500",
  sedana: "bg-teal-500",
  taqa: "bg-yellow-500",
  miyah: "bg-cyan-500",
  suqya: "bg-indigo-500",
};

export default function FieldVisitsCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonth = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: currentMonth, end: monthEnd });

  // Fetch field visits
  const { data: visits = [], isLoading } = trpc.requests.getScheduledVisits.useQuery({});

  // Group visits by date
  const visitsByDate = visits.reduce((acc: Record<string, typeof visits>, visit: any) => {
    if (visit.scheduledDate) {
      const dateKey = format(new Date(visit.scheduledDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(visit);
    }
    return acc;
  }, {});

  // Detect conflicts (multiple visits at the same time)
  const conflicts = visits.filter((visit: any, index: number) => {
    if (!visit.scheduledDate || !visit.scheduledTime) return false;
    return visits.some((other: any, otherIndex: number) => {
      if (index >= otherIndex) return false;
      if (!other.scheduledDate || !other.scheduledTime) return false;
      return (
        format(new Date(visit.scheduledDate), 'yyyy-MM-dd') === format(new Date(other.scheduledDate), 'yyyy-MM-dd') &&
        visit.scheduledTime === other.scheduledTime &&
        visit.assignedToId === other.assignedToId
      );
    });
  });

  const hasConflicts = conflicts.length > 0;

  // Get visits for selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateVisits = visitsByDate[selectedDateKey] || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">جدول الزيارات الميدانية</h1>
            <p className="text-muted-foreground">عرض تقويمي للزيارات المجدولة مع كشف التعارضات</p>
          </div>
        </div>
      </div>

      {/* Conflicts Alert */}
      {hasConflicts && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">تنبيه: تعارض في المواعيد</h3>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  يوجد {conflicts.length} زيارة متداخلة في نفس الوقت. يرجى مراجعة الجدول وتعديل المواعيد.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedDate, 'MMMM yyyy', { locale: ar })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayVisits = visitsByDate[dateKey] || [];
                const isSelected = isSameDay(day, selectedDate);
                const hasVisits = dayVisits.length > 0;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative p-3 rounded-lg border transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}
                      ${hasVisits && !isSelected ? 'border-teal-300 bg-teal-50 dark:bg-teal-950/20' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">{format(day, 'd')}</div>
                      {hasVisits && (
                        <div className="mt-1 flex justify-center gap-0.5">
                          {dayVisits.slice(0, 3).map((visit: any, i: number) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${PROGRAM_COLORS[visit.programType] || 'bg-gray-400'}`}
                            />
                          ))}
                          {dayVisits.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">+{dayVisits.length - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              زيارات {format(selectedDate, 'dd MMMM', { locale: ar })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateVisits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد زيارات مجدولة في هذا اليوم</p>
            ) : (
              <div className="space-y-3">
                {selectedDateVisits.map((visit: any) => (
                  <Link key={visit.id} href={`/requests/${visit.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={PROGRAM_COLORS[visit.programType]}>
                            {PROGRAM_LABELS[visit.programType as keyof typeof PROGRAM_LABELS]}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{visit.requestNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{visit.scheduledTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{visit.mosqueName} - {visit.mosqueCity}</span>
                        </div>
                        {visit.assignedToName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{visit.assignedToName}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Visits List */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الزيارات المجدولة ({visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد زيارات مجدولة</p>
          ) : (
            <div className="space-y-2">
              {visits.map((visit: any) => {
                const isConflict = conflicts.some((c: any) => c.id === visit.id);
                return (
                  <Link key={visit.id} href={`/requests/${visit.id}`}>
                    <Card className={`hover:bg-accent transition-colors cursor-pointer ${isConflict ? 'border-red-300 bg-red-50 dark:bg-red-950/10' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {isConflict && <AlertTriangle className="h-5 w-5 text-red-600" />}
                            <Badge className={PROGRAM_COLORS[visit.programType]}>
                              {PROGRAM_LABELS[visit.programType as keyof typeof PROGRAM_LABELS]}
                            </Badge>
                            <span className="font-mono text-sm">{visit.requestNumber}</span>
                            <span className="text-sm">{visit.mosqueName}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {visit.scheduledDate && format(new Date(visit.scheduledDate), 'dd/MM/yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {visit.scheduledTime}
                            </div>
                            {visit.assignedToName && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {visit.assignedToName}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
