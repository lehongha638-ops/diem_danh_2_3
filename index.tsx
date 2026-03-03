/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import DottedGlowBackground from './components/DottedGlowBackground';
import { 
    BriefcaseIcon, UserIcon, UsersIcon, UserCheckIcon, 
    FaceIdIcon, HistoryIcon, FileTextIcon, MailIcon, BellIcon,
    ChevronRightIcon, GridIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon,
    ImageIcon, SearchIcon, BuildingIcon, CalendarIcon, ChevronDownIcon,
    UsersGroupIcon, CheckIcon, WarningIcon,
    CameraIcon, UploadIcon, InfoIcon, FaceOutlineIcon, VideoCameraIcon,
    EyeIcon,
    DownloadIcon,
    CodeIcon,
    ClockIcon,
    ThinkingIcon,
    CheckCircleIcon,
    XCircleIcon,
    BarChartIcon,
    SettingsIcon,
} from './components/Icons';

// FIX: Added missing | in type definition
type Role = 'teacher' | 'parent' | 'student' | 'head_teacher' | 'principal';
type View = 'landing' | 'role-selection' | Role;
type AttendanceStatus = 'present' | 'absent_p' | 'absent_np' | 'unrecognized' | 'late';
type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export type AttendanceConfig = {
    morningStartTime: string;
    afternoonStartTime: string;
    customTimes: { id: string; classId: string; period: string; week: string; subject?: string; startTime: string }[];
    entryMethod: 'day' | 'session';
    leaveCalculation: 'full-day' | 'aggregate' | 'per-session';
    isConfigured: boolean;
};

interface Student {
    id: string;
    name: string;
    status: AttendanceStatus;
    className?: string;
}

interface SessionRecord {
    am: Student[];
    pm: Student[];
}

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    sessions: SessionRecord;
}

interface WeeklyAttendanceData {
  [date: string]: SessionRecord;
}

interface LeaveRequest {
    id: string;
    studentId: string;
    studentName: string;
    className?: string;
    gvcn?: string;
    parentName: string;
    leaveDate: string; // YYYY-MM-DD
    reason: string;
    status: LeaveRequestStatus;
    rejectionReason?: string;
    processedBy?: string;
    processedAt?: string;
}

interface Notification {
    id: string;
    studentId?: string; // Optional: for student-specific notifications
    type: 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

// --- Time Settings Interfaces ---
interface ClassTimeSettings {
    am: string;
    pm: string;
}

interface Period {
    start: string;
    end: string;
}

interface LessonPeriodSettings {
    am: Period[];
    pm: Period[];
}


// --- MOCK DATA ---
const generateMockStudents = () => {
    const students: Student[] = [];
    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
    const middleNames = ['Văn', 'Thị', 'Minh', 'Thanh', 'Quốc', 'Đức', 'Hồng', 'Kim'];
    const lastNames = ['An', 'Bình', 'Cường', 'Dung', 'Em', 'Hằng', 'Lan', 'Hùng', 'Giang', 'Hải', 'Sơn', 'Tú', 'Anh', 'Chi', 'Duy', 'Linh'];
    const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'present', 'late', 'absent_p', 'absent_np'];

    // Generate for Grade 10: 8 classes (10A1 to 10A8), 30 students each
    for (let c = 1; c <= 8; c++) {
        const className = `10A${c}`;
        for (let s = 1; s <= 30; s++) {
            const id = `HS10${c}${s.toString().padStart(2, '0')}`;
            const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            students.push({ id, name, status, className });
        }
    }

    // Add some students for other grades for consistency
    students.push({ id: 'HS1101', name: 'Hoàng Văn Em', status: 'unrecognized', className: '11A1' });
    students.push({ id: 'HS1201', name: 'Vũ Thị Hằng', status: 'present', className: '12A1' });
    students.push({ id: 'HS1202', name: 'Đặng Thị Lan', status: 'late', className: '12A2' });

    return students;
};

const mockStudentsData: Student[] = generateMockStudents();

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

const formatDateForID = (date: Date) => date.toISOString().split('T')[0];

const mockLeaveRequestsData: LeaveRequest[] = [
    {
        id: 'req1',
        studentId: 'HS004',
        studentName: 'Phạm Thị Dung',
        className: '10A1',
        gvcn: 'Nguyễn Văn D',
        parentName: 'Phạm Văn Long',
        leaveDate: formatDateForID(today),
        reason: 'Con bị sốt cao, gia đình đã cho con đi khám và bác sĩ yêu cầu nghỉ ngơi tại nhà. Xin phép cho con nghỉ học ngày hôm nay để theo dõi sức khỏe. Gia đình xin chân thành cảm ơn.',
        status: 'approved'
    },
    {
        id: 'req2',
        studentId: 'HS002',
        studentName: 'Trần Thị Bình',
        className: '10A2',
        gvcn: 'Lê Thị E',
        parentName: 'Trần Văn Bách',
        leaveDate: formatDateForID(yesterday),
        reason: 'Con có lịch tái khám nha khoa, gia đình xin phép cho con nghỉ buổi sáng.',
        status: 'approved'
    },
    {
        id: 'req3',
        studentId: 'HS003',
        studentName: 'Lê Minh Cường',
        className: '10A3',
        gvcn: 'Trần Văn F',
        parentName: 'Lê Thị Hoa',
        leaveDate: formatDateForID(today),
        reason: 'Gia đình có việc đột xuất, xin cho cháu nghỉ.',
        status: 'pending'
    },
    {
        id: 'req4',
        studentId: 'HS002',
        studentName: 'Trần Thị Bình',
        className: '10A2',
        gvcn: 'Lê Thị E',
        parentName: 'Trần Văn Bách',
        leaveDate: formatDateForID(threeDaysAgo),
        reason: 'Xin nghỉ phép đi du lịch cùng gia đình.',
        status: 'rejected'
    },
    {
        id: 'req5',
        studentId: 'HS001',
        studentName: 'Nguyễn Văn An',
        className: '10A1',
        gvcn: 'Nguyễn Văn D',
        parentName: 'Nguyễn Thị D',
        leaveDate: formatDateForID(today),
        reason: 'Con bị đau bụng, gia đình xin phép cho con nghỉ buổi chiều để theo dõi.',
        status: 'pending'
    }
];


const mockHistoryData: AttendanceRecord[] = [
    {
        date: formatDateForID(yesterday), // Trần Thị Bình vắng có phép buổi sáng
        sessions: {
            am: [
                { id: 'HS001', name: 'Nguyễn Văn An', status: 'present' },
                { id: 'HS002', name: 'Trần Thị Bình', status: 'absent_p' }, // Consistent with leave request
                { id: 'HS003', name: 'Lê Minh Cường', status: 'present' },
                { id: 'HS004', name: 'Phạm Thị Dung', status: 'present' },
                { id: 'HS005', name: 'Hoàng Văn Em', status: 'present' },
                { id: 'HS006', name: 'Vũ Thị Hằng', status: 'present' },
            ],
            pm: [
                { id: 'HS001', name: 'Nguyễn Văn An', status: 'present' },
                { id: 'HS002', name: 'Trần Thị Bình', status: 'present' },
                { id: 'HS003', name: 'Lê Minh Cường', status: 'present' },
                { id: 'HS004', name: 'Phạm Thị Dung', status: 'present' },
                { id: 'HS005', name: 'Hoàng Văn Em', status: 'present' },
                { id: 'HS006', name: 'Vũ Thị Hằng', status: 'present' },
            ]
        }
    },
    {
        date: formatDateForID(twoDaysAgo), // Trần Thị Bình vắng không phép buổi chiều
        sessions: {
            am: [
                { id: 'HS001', name: 'Nguyễn Văn An', status: 'present' },
                { id: 'HS002', name: 'Trần Thị Bình', status: 'present' },
                { id: 'HS003', name: 'Lê Minh Cường', status: 'absent_np' },
                { id: 'HS004', name: 'Phạm Thị Dung', status: 'present' },
                { id: 'HS005', name: 'Hoàng Văn Em', status: 'unrecognized' },
                { id: 'HS006', name: 'Vũ Thị Hằng', status: 'present' },
            ],
            pm: [
                { id: 'HS001', name: 'Nguyễn Văn An', status: 'present' },
                { id: 'HS002', name: 'Trần Thị Bình', status: 'absent_np' }, // Warning notification trigger
                { id: 'HS003', name: 'Lê Minh Cường', status: 'absent_np' },
                { id: 'HS004', name: 'Phạm Thị Dung', status: 'present' },
                { id: 'HS005', name: 'Hoàng Văn Em', status: 'present' },
                { id: 'HS006', name: 'Vũ Thị Hằng', status: 'present' },
            ]
        }
    },
     {
        date: formatDateForID(threeDaysAgo), // All present
        sessions: {
            am: mockStudentsData.map(s => ({ ...s, status: 'present' })),
            pm: mockStudentsData.map(s => ({ ...s, status: 'present' })),
        }
    }
];

const mockNotifications: Notification[] = [
    {
        id: 'notif1',
        studentId: 'HS003',
        type: 'warning',
        title: 'Vắng không phép',
        message: 'Học sinh Lê Minh Cường vắng mặt không phép.',
        timestamp: '8:05, Hôm nay',
        read: false,
    },
    {
        id: 'notif2',
        studentId: 'HS004',
        type: 'info',
        title: 'Vắng có phép',
        message: 'Phụ huynh học sinh Phạm Thị Dung đã gửi đơn xin nghỉ.',
        timestamp: '7:45, Hôm nay',
        read: false,
    },
    {
        id: 'notif3',
        studentId: 'HS005',
        type: 'warning',
        title: 'Chưa nhận diện',
        message: 'Không thể nhận diện học sinh Hoàng Văn Em.',
        timestamp: '8:10, Hôm nay',
        read: true,
    },
    {
        id: 'notif4',
        studentId: 'HS002',
        type: 'info',
        title: 'Đơn nghỉ được duyệt',
        message: 'Đơn xin nghỉ cho học sinh Trần Thị Bình ngày hôm qua đã được duyệt.',
        timestamp: '16:30, Hôm qua',
        read: false,
    },
    {
        id: 'notif5',
        studentId: 'HS002',
        type: 'warning',
        title: 'Vắng không phép',
        message: 'Học sinh Trần Thị Bình vắng mặt không phép buổi chiều 2 ngày trước.',
        timestamp: '14:15, 2 ngày trước',
        read: true,
    },
];

type TrainingStatus = 'trained' | 'not_trained' | 'training';

interface TeacherFaceData {
    stt: number;
    name: string;
    photoCount: number;
    teacherId: string;
    trainingStatus: TrainingStatus;
    requiresPhotoUpdate?: boolean;
}

const mockTeacherFaceData: TeacherFaceData[] = [
    { stt: 1, name: 'Dư Nguyễn Hà', photoCount: 1, teacherId: '7903641337', trainingStatus: 'training' },
    { stt: 2, name: 'Nhữ Hòa', photoCount: 1, teacherId: '7903723950', trainingStatus: 'trained' },
    { stt: 3, name: 'Hoàng Thị Lan', photoCount: 1, teacherId: '7903671242', trainingStatus: 'trained' },
    { stt: 4, name: 'Lê Thị Bích Thảo', photoCount: 1, teacherId: '7903702768', trainingStatus: 'trained' },
    { stt: 5, name: 'Lâm Nguyễn Phương Ân', photoCount: 0, teacherId: '7903536423', trainingStatus: 'not_trained', requiresPhotoUpdate: true },
    { stt: 6, name: 'Lê Tuấn Huy', photoCount: 0, teacherId: '7903670419', trainingStatus: 'not_trained' },
    { stt: 7, name: 'Ngô Văn Trường', photoCount: 0, teacherId: '7903669654', trainingStatus: 'not_trained' },
    { stt: 8, name: 'Trần Thanh Khang', photoCount: 0, teacherId: '7903669885', trainingStatus: 'not_trained' },
];

interface ClassRecognitionStatus {
  id: string;
  name: string;
  recognized: number;
  total: number;
  isTeacherClass?: boolean;
}

const mockClassRecognitionData: ClassRecognitionStatus[] = [
  { id: 'gv', name: 'Lớp Giáo viên', recognized: 6, total: 54, isTeacherClass: true },
  { id: '1.1', name: 'Lớp 1.1', recognized: 29, total: 40 },
  { id: '1.2', name: 'Lớp 1.2', recognized: 31, total: 40 },
  { id: '1.3', name: 'Lớp 1.3', recognized: 35, total: 38 },
  { id: '2.1', name: 'Lớp 2.1', recognized: 30, total: 32 },
];


const statusOptions: Record<AttendanceStatus, string> = {
    present: 'Có mặt',
    late: 'Đi muộn',
    absent_p: 'Vắng CP',
    absent_np: 'Vắng KP',
    unrecognized: 'Chưa nhận diện'
};


// --- MODAL COMPONENT ---
const Modal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode; 
    footer: React.ReactNode;
    className?: string;
}> = ({ isOpen, onClose, title, children, footer, className = '' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                <div className="modal-footer">
                    {footer}
                </div>
            </div>
        </div>
    );
};

// --- NOTIFICATION COMPONENT ---
const NotificationBell: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const getIconForType = (type: 'warning' | 'info') => {
        switch (type) {
            case 'warning': return <WarningIcon />;
            case 'info': return <InfoIcon />;
            default: return null;
        }
    };

    return (
        <div className="notification-area">
            <button className="notification-button" onClick={() => setIsOpen(!isOpen)}>
                <BellIcon />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Thông báo</h4>
                    </div>
                    <ul className="notification-list">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <li key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                                <div className={`notification-icon icon-${notif.type}`}>
                                    {getIconForType(notif.type)}
                                </div>
                                <div className="notification-content">
                                    <p className="notification-title">{notif.title}</p>
                                    <p className="notification-message">{notif.message}</p>
                                    <p className="notification-timestamp">{notif.timestamp}</p>
                                </div>
                            </li>
                        )) : <li className="notification-empty">Không có thông báo mới.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- DASHBOARD COMPONENTS ---
const Dashboard: React.FC<{ role: string; onBack: () => void; children: React.ReactNode; onOpenWorkflow: () => void; onOpenTestCases: () => void; notifications: Notification[]; }> = ({ role, children, onBack, onOpenWorkflow, onOpenTestCases, notifications }) => (
    <div className="dashboard-container">
        <header className="dashboard-header">
            <div className="header-left">
                 <button onClick={onBack} className="back-button">&larr; Chọn lại vai trò</button>
                 <h1>Module Điểm danh: <span className="role-name">{role}</span></h1>
            </div>
            <div className="header-right">
                <button className="workflow-button-header" onClick={onOpenWorkflow}>
                    Xem quy trình
                </button>
                <button className="workflow-button-header" onClick={onOpenTestCases}>
                    Kịch bản test
                </button>
                <NotificationBell notifications={notifications} />
            </div>
        </header>
        {children}
    </div>
);

// --- DATE HELPERS ---
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
    return date.toLocaleDateString('vi-VN', options);
};

const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const other = new Date(date);
    other.setHours(0, 0, 0, 0);
    return other < today;
};

const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const other = new Date(date);
    other.setHours(0, 0, 0, 0);
    return other > today;
};

// --- DATA HELPERS ---
const createSessionData = (): Student[] => JSON.parse(JSON.stringify(mockStudentsData.map(s => ({...s, status: 'unrecognized' as AttendanceStatus}))));

const generateInitialWeeklyData = (startDate: Date): WeeklyAttendanceData => {
    const weekData: WeeklyAttendanceData = {};
    const today = new Date();
    
    // Filter students to only one class (10A1) for the teacher view
    const teacherClassStudents = mockStudentsData.filter(s => s.className === '10A1');
    
    // Generate data for 30 days before today and 14 days after today
    // to ensure there's plenty of data to test with.
    for (let i = -30; i <= 14; i++) {
        const day = addDays(today, i);
        const dateStr = formatDateForID(day);
        
        if (i < 0) {
            // Past data: mostly present, some late/absent
            weekData[dateStr] = {
                am: teacherClassStudents.map(s => ({
                    ...s,
                    status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent_p')
                })),
                pm: teacherClassStudents.map(s => ({
                    ...s,
                    status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent_np')
                })),
            };
        } else if (i === 0) {
            // Today: AM is recognized, PM is unrecognized
            weekData[dateStr] = {
                am: JSON.parse(JSON.stringify(teacherClassStudents)),
                pm: teacherClassStudents.map(s => ({ ...s, status: 'unrecognized' })),
            };
        } else {
            // Future: all unrecognized
            weekData[dateStr] = {
                am: teacherClassStudents.map(s => ({ ...s, status: 'unrecognized' })),
                pm: teacherClassStudents.map(s => ({ ...s, status: 'unrecognized' })),
            };
        }
    }
    return weekData;
};

const RecognitionHistoryView = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const stats = {
        students: { recognized: 826, total: 1088 },
        teachers: { recognized: 6, total: 54 },
        classes: 30,
        totalRecognitions: 832
    };

    const handlePrevDay = () => setSelectedDate(prev => addDays(prev, -1));
    const handleNextDay = () => {
        if (!isToday(selectedDate)) {
             setSelectedDate(prev => addDays(prev, 1));
        }
    };
    const handleToday = () => setSelectedDate(new Date());

    return (
        <div className="recognition-history-page">
            <div className="date-selector-bar">
                <div className="date-display">
                    <CalendarIcon /> 
                    Ngày: {isToday(selectedDate) 
                        ? 'Hôm nay' 
                        : formatDate(selectedDate, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="date-picker-controls">
                    <button className="date-nav-button" onClick={handlePrevDay}>
                        &lt; {formatDate(addDays(selectedDate, -1), { day: '2-digit', month: '2-digit' })}
                    </button>
                    <button 
                        className={`today-button ${isToday(selectedDate) ? 'active' : ''}`} 
                        onClick={handleToday}
                    >
                        Hôm nay
                    </button>
                    <button 
                        className="date-nav-button" 
                        onClick={handleNextDay} 
                        disabled={isToday(selectedDate)}
                    >
                        {formatDate(addDays(selectedDate, 1), { day: '2-digit', month: '2-digit' })} &gt;
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card students">
                    <div className="stat-value">{stats.students.recognized}/{stats.students.total}</div>
                    <div className="stat-label">Học sinh nhận diện</div>
                </div>
                <div className="stat-card teachers">
                    <div className="stat-value">{stats.teachers.recognized}/{stats.teachers.total}</div>
                    <div className="stat-label">Giáo viên nhận diện</div>
                </div>
                <div className="stat-card classes">
                    <div className="stat-value">{stats.classes}</div>
                    <div className="stat-label">Số lớp</div>
                </div>
                <div className="stat-card total">
                    <div className="stat-value">{stats.totalRecognitions}</div>
                    <div className="stat-label">Tổng lượt nhận diện</div>
                </div>
            </div>

            <div className="filters-bar">
                <div className="filter-dropdown">
                    <span>Tất cả các lớp</span>
                    <ChevronDownIcon />
                </div>
                <div className="filter-search">
                    <SearchIcon />
                    <input type="text" placeholder="Tìm kiếm theo mã hoặc, tên học sinh/giáo viên..." />
                </div>
            </div>

            <div className="class-list-container">
                <div className="class-list-header">
                    <BuildingIcon />
                    <h3>Danh sách nhận diện theo lớp</h3>
                </div>
                <div className="class-list">
                    {mockClassRecognitionData.map(cls => (
                        <div key={cls.id} className="class-list-item">
                            <div className="class-name">
                                <ChevronRightIcon />
                                {cls.isTeacherClass ? <UsersGroupIcon /> : <UsersIcon />}
                                <span>{cls.name}</span>
                            </div>
                            <div className="class-status-tags">
                                <div className="tag-recognized">
                                    <CheckIcon />
                                    <span>{cls.recognized}/{cls.total}</span>
                                </div>
                                <div className="tag-unrecognized">
                                    <WarningIcon />
                                    <span>{cls.total - cls.recognized} chưa nhận diện</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AiTrainingStatusWidget: React.FC = () => {
    return (
      <div className="ai-training-widget" role="alert">
        <ThinkingIcon />
        <div>
          <p className="widget-title">AI đang học...</p>
          <p className="widget-text">Dự kiến hoàn thành sau 24h.</p>
        </div>
      </div>
    );
};


const TeacherView = ({ onBack, onOpenWorkflow, onOpenTestCases, attendanceConfig }: { onBack: () => void; onOpenWorkflow: () => void; onOpenTestCases: () => void; attendanceConfig: AttendanceConfig }) => {
    // FIX: Set default tab to 'face-registration' for better workflow
    const [activeTab, setActiveTab] = useState('face-registration');
    
    // Take Attendance tab state
    const [currentWeekData, setCurrentWeekData] = useState<WeeklyAttendanceData>(() => generateInitialWeeklyData(getWeekStart(new Date())));
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    const [selectedSession, setSelectedSession] = useState<'am' | 'pm'>('am');
    const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
    const [isWeekListOpen, setIsWeekListOpen] = useState(false);

    // Face registration state
    const [searchTerm, setSearchTerm] = useState('');
    const [faceRegTab, setFaceRegTab] = useState('original');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherFaceData | null>(null);
    const [recognitionImages, setRecognitionImages] = useState<string[]>([]);
    const recognitionFileInputRef = useRef<HTMLInputElement>(null);
    const [modalImages, setModalImages] = useState<string[]>([]);
    const originalPhotoInputRef = useRef<HTMLInputElement>(null);


    // Modal state for rejection reason
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [requestToReject, setRequestToReject] = useState<string | null>(null);

    // Modal state for success confirmation
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Modal state for leave requests
    const [isLeaveRequestModalOpen, setIsLeaveRequestModalOpen] = useState(false);
    const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequestsData);
    const [leaveRequestSubTab, setLeaveRequestSubTab] = useState('pending');
    const [leaveRequestSearchTerm, setLeaveRequestSearchTerm] = useState('');


    // Reports tab state
    const [reportType, setReportType] = useState('day');
    const [reportValue, setReportValue] = useState(() => formatDateForID(getWeekStart(new Date())));
    const [reportSession, setReportSession] = useState<'am' | 'pm'>('am');
    const [reportYear, setReportYear] = useState('2025-2026');
    const [reportSemester, setReportSemester] = useState('1');
    const [reportSearchTerm, setReportSearchTerm] = useState('');

    const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
        const selectedDateStr = formatDateForID(selectedDay);
        
        setCurrentWeekData(prevData => {
            const newData = { ...prevData };
            const dayData = { ...newData[selectedDateStr] };
            const sessionData = [...dayData[selectedSession]];
            const studentIndex = sessionData.findIndex(s => s.id === studentId);
            
            if (studentIndex > -1) {
                // Prevent unnecessary updates
                if (sessionData[studentIndex].status === newStatus) return prevData;
                sessionData[studentIndex] = { ...sessionData[studentIndex], status: newStatus };
            }

            dayData[selectedSession] = sessionData;
            newData[selectedDateStr] = dayData;
            return newData;
        });
    };

    const handleSaveClick = () => {
        if (isFuture(selectedDay)) {
            // This case should not be reachable as the button is disabled.
            return;
        }
        if (isToday(selectedDay)) {
            // In a real app, this would be an API call
            console.log("Saving today's data:", currentWeekData[formatDateForID(selectedDay)][selectedSession]);
            setSuccessMessage('Đã lưu điểm danh thành công! Thông báo đã được gửi đến phụ huynh và ban giám hiệu.');
            setShowSuccessModal(true);
        } else { // Catches all past dates
            // Directly save and notify for past dates as per user request
            const selectedDateStr = formatDateForID(selectedDay);
            console.log(`SAVING PAST DATA: Date: ${selectedDateStr}, Session: ${selectedSession.toUpperCase()}`);
            setSuccessMessage('Đã cập nhật điểm danh quá khứ thành công! Thông báo tự động đã được gửi đến học sinh, phụ huynh và ban giám hiệu.');
            setShowSuccessModal(true);
        }
    };

    const handleOpenUploadModal = (teacher: TeacherFaceData) => {
        setSelectedTeacher(teacher);
        setModalImages([]); // Reset images when opening
        setIsUploadModalOpen(true);
    };

    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
        setSelectedTeacher(null);
    };

    const handleRecognitionUploadClick = () => {
        recognitionFileInputRef.current?.click();
    };
    
    const handleOriginalPhotoUploadClick = () => {
        originalPhotoInputRef.current?.click();
    };

    const processFiles = (files: FileList | null, setImageState: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (!files) return;
        const fileArray = Array.from(files);
        const imageUrls: string[] = [];
        let filesProcessed = 0;

        // FIX: The type predicate `f is Blob` was invalid because `Blob` is a supertype of `File`, and predicates must narrow types.
        // Changed to `f is File` which is a valid predicate and correctly types the filtered array.
        const blobFiles = fileArray.filter((f): f is File => f instanceof Blob);
        if (blobFiles.length === 0) return;

        blobFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    imageUrls.push(reader.result);
                }
                filesProcessed++;
                if (filesProcessed === blobFiles.length) {
                    setImageState(prev => [...prev, ...imageUrls]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRecognitionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files, setRecognitionImages);
    };
    
    const handleOriginalPhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files, setModalImages);
    };

    const handleSaveRecognition = () => {
        if (recognitionImages.length === 0) return;
        // Simulate API call
        console.log("Saving recognition images:", recognitionImages);
        setSuccessMessage(`Đã lưu thành công ${recognitionImages.length} ảnh nhận diện.`);
        setShowSuccessModal(true);
        setRecognitionImages([]); // Clear after saving
    };
    
    const handleSaveOriginalPhotos = () => {
        if (!selectedTeacher || modalImages.length === 0) return;
        console.log(`Saving ${modalImages.length} photos for ${selectedTeacher.name}`);
        setSuccessMessage(`Đã lưu thành công ${modalImages.length} ảnh cho ${selectedTeacher.name}.`);
        setShowSuccessModal(true);
        handleCloseUploadModal();
    };
    
    const mockCamera = () => {
        alert('Chức năng camera đang được phát triển!');
    };

    const handleOpenLeaveRequestModal = (request: LeaveRequest) => {
        setSelectedLeaveRequest(request);
        setIsLeaveRequestModalOpen(true);
    };

    const handleCloseLeaveRequestModal = () => {
        setIsLeaveRequestModalOpen(false);
        setSelectedLeaveRequest(null);
    };

    const handleApproveRequest = (id: string) => {
        const request = leaveRequests.find(r => r.id === id);
        if (!request) return;

        // 1. Update leave request status
        setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));

        // 2. Update student's attendance status for that day
        const requestDate = request.leaveDate;
        setCurrentWeekData(prevData => {
            if (!prevData[requestDate]) return prevData;

            const newData = { ...prevData };
            const dayData = { ...newData[requestDate] };

            // Assuming leave is for the whole day, update both sessions
            const updateSession = (session: Student[]) => 
                session.map(student => 
                    student.id === request.studentId ? { ...student, status: 'absent_p' as AttendanceStatus } : student
                );
            
            dayData.am = updateSession(dayData.am);
            dayData.pm = updateSession(dayData.pm);
            
            newData[requestDate] = dayData;
            return newData;
        });

        setSuccessMessage(`Đã duyệt đơn cho học sinh ${request.studentName}.`);
        setShowSuccessModal(true);
    };
    
    const handleDenyRequest = (id: string) => {
        setRequestToReject(id);
        setIsRejectionModalOpen(true);
    };

    const confirmDenyRequest = () => {
        if (!rejectionReason.trim()) {
            alert('Vui lòng nhập lý do từ chối.');
            return;
        }
        const id = requestToReject;
        const request = leaveRequests.find(r => r.id === id);
        if (!request) return;
        setLeaveRequests(prev => prev.map(r => r.id === id ? { 
            ...r, 
            status: 'rejected', 
            rejectionReason: rejectionReason,
            processedBy: 'Giáo viên Chủ nhiệm',
            processedAt: new Date().toLocaleString('vi-VN')
        } : r));
        setSuccessMessage(`Đã từ chối đơn của học sinh ${request.studentName}.`);
        setShowSuccessModal(true);
        setIsRejectionModalOpen(false);
        setRejectionReason('');
        setRequestToReject(null);
    };

    const pendingLeaveRequestsCount = leaveRequests.filter(r => r.status === 'pending').length;

    // FIX: Reordered menu items to follow a more logical workflow for teachers.
    const menu = {
        'face-registration': { label: 'Đăng ký khuôn mặt', icon: <FaceIdIcon /> },
        'recognition-history': { label: 'Lịch sử nhận diện', icon: <BuildingIcon /> },
        'take-attendance': { label: 'Thực hiện Điểm danh', icon: <UserCheckIcon /> },
        'leave-requests': { label: 'Duyệt đơn nghỉ', icon: <MailIcon />, badge: pendingLeaveRequestsCount },
        'reports': { label: 'Báo cáo / Xuất dữ liệu', icon: <FileTextIcon /> },
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'recognition-history':
                return <RecognitionHistoryView />;
            case 'take-attendance': {
                const weekDates = Array.from({ length: 7 }, (_, i) => addDays(getWeekStart(selectedDay), i));
                const weekStart = weekDates[0];
                const weekEnd = weekDates[6];

                // Generate a list of weeks (4 weeks before and 4 weeks after current week)
                const generateWeekList = () => {
                    const weeks = [];
                    const currentWeekStart = getWeekStart(new Date());
                    for (let i = -4; i <= 4; i++) {
                        const start = addDays(currentWeekStart, i * 7);
                        const end = addDays(start, 6);
                        weeks.push({ start, end });
                    }
                    return weeks;
                };
                const weekList = generateWeekList();

                const selectedDateStr = formatDateForID(selectedDay);
                const studentsForSession = currentWeekData[selectedDateStr]?.[selectedSession] ?? [];

                const filteredStudents = studentsForSession.filter(s => 
                    s.name.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
                    s.id.toLowerCase().includes(attendanceSearchTerm.toLowerCase())
                );

                const sortedStudents = [...filteredStudents].sort((a, b) => {
                    if (a.status === 'unrecognized' && b.status !== 'unrecognized') return -1;
                    if (a.status !== 'unrecognized' && b.status === 'unrecognized') return 1;
                    return a.name.localeCompare(b.name, 'vi');
                });

                const isEditable = !isFuture(selectedDay);
                const isEditingPast = isPast(selectedDay);

                const leavesForDay = leaveRequests.filter(req => req.leaveDate === selectedDateStr && req.status !== 'rejected');

                return <>
                    <div className="attendance-picker-compact">
                        <div className="picker-top-row">
                            <div className="week-dropdown-container">
                                <button className="week-dropdown-btn" onClick={() => setIsWeekListOpen(!isWeekListOpen)}>
                                    <CalendarIcon className="w-4 h-4 text-accent-primary" />
                                    <span className="current-week-text">
                                        {formatDate(weekStart, {day: '2-digit', month: '2-digit'})} đến {formatDate(weekEnd, {day: '2-digit', month: '2-digit'})}
                                    </span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isWeekListOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isWeekListOpen && (
                                    <div className="week-dropdown-list-new">
                                        <div className="week-dropdown-header">Chọn tuần</div>
                                        <div className="week-items-container">
                                            {weekList.map((w, idx) => {
                                                const isSelected = formatDateForID(w.start) === formatDateForID(weekStart);
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={`week-item ${isSelected ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDay(w.start);
                                                            setIsWeekListOpen(false);
                                                        }}
                                                    >
                                                        <span className="week-item-dates">
                                                            {formatDate(w.start, {day: '2-digit', month: '2-digit'})} đến {formatDate(w.end, {day: '2-digit', month: '2-digit'})}
                                                        </span>
                                                        {isSelected && <CheckIcon className="w-4 h-4" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {attendanceConfig.entryMethod === 'session' && (
                                <div className="session-selector-compact">
                                    <button className={`session-pill ${selectedSession === 'am' ? 'active' : ''}`} onClick={() => setSelectedSession('am')}>Sáng</button>
                                    <button className={`session-pill ${selectedSession === 'pm' ? 'active' : ''}`} onClick={() => setSelectedSession('pm')}>Chiều</button>
                                </div>
                            )}
                        </div>

                        <div className="day-picker-horizontal-compact">
                            {weekDates.map(day => {
                                const dayStr = formatDateForID(day);
                                const isSelected = dayStr === selectedDateStr;
                                return (
                                    <button 
                                        key={dayStr} 
                                        className={`day-pill-compact ${isSelected ? 'active' : ''}`}
                                        onClick={() => setSelectedDay(day)}
                                    >
                                        <span className="day-short">{formatDate(day, { weekday: 'short' })}</span>
                                        <span className="day-num">{formatDate(day, { day: '2-digit' })}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="content-grid">
                        <div className="card">
                            <div className="card-header-with-filters">
                                <div className="filter-search">
                                    <SearchIcon />
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm học sinh..." 
                                        value={attendanceSearchTerm}
                                        onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* FIX: Added instructional message for teachers to handle unrecognized students. */}
                            <div className="info-message instruction">
                                <InfoIcon />
                                <span>Lưu ý: Đối với các học sinh 'Chưa nhận diện', giáo viên cần xác nhận và cập nhật lại trạng thái thủ công.</span>
                            </div>
                            <div className="scrollable-list">
                                {sortedStudents.length > 0 ? (
                                    <ul className="student-list interactive">
                                        {sortedStudents.map(student => (
                                            <li key={student.id}>
                                                <span className="student-name">{student.name}</span>
                                                <div className="status-and-actions">
                                                    <div className="status-buttons">
                                                        {(Object.keys(statusOptions) as AttendanceStatus[]).map(statusKey => (
                                                            <button 
                                                                key={statusKey}
                                                                onClick={() => handleStatusChange(student.id, statusKey)}
                                                                className={`status-button status-${statusKey} ${student.status === statusKey ? 'active' : ''}`}
                                                                title={statusOptions[statusKey]}
                                                                disabled={!isEditable}
                                                            >
                                                                {statusOptions[statusKey]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-data-message">Không có danh sách học sinh cho buổi này.</p>
                                )}
                            </div>
                        </div>
                        <div className="card">
                            <h3>Thao tác</h3>
                            <button className="action-button primary" disabled={!isEditable} onClick={handleSaveClick}>Lưu / Xác nhận điểm danh</button>
                            
                            {!isEditable && (
                                <div className="sub-section info-message readonly">
                                    <p><strong>Không thể thực hiện:</strong> Không thể điểm danh cho một ngày trong tương lai.</p>
                                </div>
                            )}
                            {isEditingPast && (
                                <div className="sub-section info-message warning">
                                    <p>Bạn đang xem dữ liệu điểm danh trong quá khứ.</p>
                                </div>
                            )}
                            
                            <div className="sub-section">
                                <h4>Đơn xin nghỉ ({leavesForDay.length})</h4>
                                {leavesForDay.length > 0 ? (
                                    <ul className="leave-request-list">
                                        {leavesForDay.map(req => (
                                            <li key={req.id}>
                                                <span>{req.studentName}</span>
                                                <button className="view-leave-button-secondary" onClick={() => handleOpenLeaveRequestModal(req)}>
                                                    <EyeIcon /> Xem đơn
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Không có đơn xin nghỉ nào cho ngày này.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>;
            }
            case 'face-registration': {
                 const filteredTeachers = mockTeacherFaceData.filter(teacher => 
                    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    teacher.teacherId.includes(searchTerm)
                 );
                 const trainingStatusText: Record<TrainingStatus, string> = {
                    trained: 'Đã train',
                    not_trained: 'Chưa train',
                    training: 'Đang train'
                 };

                 return <>
                    <div className={faceRegTab === 'recognition' ? 'face-reg-header-dark' : ''}>
                        <div className="tab-nav">
                            <button 
                                className={faceRegTab === 'original' ? 'active' : ''} 
                                onClick={() => setFaceRegTab('original')}
                            >
                                Up ảnh gốc học sinh/ giáo viên
                            </button>
                            <button 
                                className={faceRegTab === 'recognition' ? 'active' : ''} 
                                onClick={() => setFaceRegTab('recognition')}
                            >
                                Upload ảnh xác nhận
                            </button>
                        </div>
                    </div>
                    <div className="tab-content">
                        {faceRegTab === 'original' && (
                            <div className="face-management-container">
                                <div className="search-bar-container">
                                   <input 
                                        type="text" 
                                        placeholder="Tìm kiếm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                   />
                                   <SearchIcon />
                                </div>
                                <div className="teacher-table-wrapper">
                                    <table className="teacher-table">
                                        <thead>
                                            <tr>
                                                <th>STT</th>
                                                <th>Thao tác</th>
                                                <th>Tên giáo viên</th>
                                                <th>Số lượng ảnh</th>
                                                <th>Mã giáo viên</th>
                                                <th>Trạng thái AI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTeachers.map(teacher => (
                                                <tr key={teacher.stt}>
                                                    <td>{teacher.stt}</td>
                                                    <td className="action-cell">
                                                        <button className="table-button upload" onClick={() => handleOpenUploadModal(teacher)}>
                                                            <ImageIcon/> Tải ảnh
                                                        </button>
                                                        <button className="table-button history"><HistoryIcon/> Lịch sử</button>
                                                    </td>
                                                    <td>{teacher.name}</td>
                                                    <td>
                                                        <span className={`photo-count count-${teacher.photoCount > 0 ? 'positive' : 'zero'}`}>
                                                            {teacher.photoCount}
                                                        </span>
                                                    </td>
                                                    <td>{teacher.teacherId}</td>
                                                    <td>
                                                        {teacher.trainingStatus === 'training' ? (
                                                            <AiTrainingStatusWidget />
                                                        ) : (
                                                            <span className={`training-status ${teacher.trainingStatus}`}>
                                                                {trainingStatusText[teacher.trainingStatus]}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {faceRegTab === 'recognition' && (
                           <div className="rec-upload-panels">
                                <div className="rec-panel">
                                    <div className="rec-panel-header">
                                        <CameraIcon />
                                        <span>Chụp Ảnh / Tải Lên</span>
                                    </div>
                                    <div className="rec-panel-body">
                                        <input
                                            type="file"
                                            ref={recognitionFileInputRef}
                                            onChange={handleRecognitionFileChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            multiple
                                        />
                                        <button className="rec-btn camera" onClick={mockCamera}>
                                            <VideoCameraIcon /> Bật Camera
                                        </button>
                                        <button className="rec-btn upload" onClick={handleRecognitionUploadClick}>
                                            <UploadIcon /> Tải Ảnh
                                        </button>
                                    </div>
                                </div>
                                <div className="rec-panel">
                                    <div className="rec-panel-header">
                                        <UsersIcon />
                                        <span>Danh sách nhận diện ({recognitionImages.length})</span>
                                    </div>
                                    <div className="rec-panel-body scrollable">
                                        {recognitionImages.length === 0 ? (
                                            <div className="rec-placeholder">
                                                <ImageIcon />
                                                <p>Chụp ảnh hoặc tải lên để bắt đầu nhận diện</p>
                                            </div>
                                        ) : (
                                            <div className="rec-results-grid">
                                                {recognitionImages.map((imgSrc, index) => (
                                                    <img key={index} src={imgSrc} alt={`Recognition preview ${index + 1}`} className="rec-image-preview" />
                                                ))}
                                            </div>
                                        )}
                                         {recognitionImages.length > 0 && (
                                            <button className="action-button primary" style={{width: '100%', marginTop: 'auto'}} onClick={handleSaveRecognition}>
                                                Lưu & Nhận diện
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 </>;
            }
            case 'leave-requests': {
                const pendingRequests = leaveRequests.filter(r => r.status === 'pending' && (
                    r.studentName.toLowerCase().includes(leaveRequestSearchTerm.toLowerCase()) ||
                    r.studentId.toLowerCase().includes(leaveRequestSearchTerm.toLowerCase())
                ));
                const processedRequests = leaveRequests.filter(r => r.status !== 'pending' && (
                    r.studentName.toLowerCase().includes(leaveRequestSearchTerm.toLowerCase()) ||
                    r.studentId.toLowerCase().includes(leaveRequestSearchTerm.toLowerCase())
                ));
                const statusText: Record<LeaveRequestStatus, string> = {
                    pending: 'Chờ duyệt',
                    approved: 'Đã Duyệt',
                    rejected: 'Bị Từ Chối',
                };
                
                return (
                    <div className="leave-approval-container">
                        <div className="card-header-with-filters">
                            <div className="filter-search">
                                <SearchIcon />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm đơn nghỉ..." 
                                    value={leaveRequestSearchTerm}
                                    onChange={(e) => setLeaveRequestSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* FIX: Added sub-tabs to separate pending and processed leave requests. */}
                        <div className="sub-tab-nav">
                            <button 
                                className={`sub-tab-button ${leaveRequestSubTab === 'pending' ? 'active' : ''}`}
                                onClick={() => setLeaveRequestSubTab('pending')}
                            >
                                Đang chờ duyệt ({pendingRequests.length})
                            </button>
                            <button 
                                className={`sub-tab-button ${leaveRequestSubTab === 'processed' ? 'active' : ''}`}
                                onClick={() => setLeaveRequestSubTab('processed')}
                            >
                                Đã xử lý ({processedRequests.length})
                            </button>
                        </div>

                        <div className="scrollable-list">
                            {leaveRequestSubTab === 'pending' && (
                                <>
                                    {pendingRequests.length > 0 ? (
                                        <div className="processed-leave-buttons">
                                            {pendingRequests.map(req => (
                                                <button key={req.id} className="processed-leave-btn status-pending" onClick={() => handleOpenLeaveRequestModal(req)}>
                                                    <span className='student-name'>{req.studentName}</span>
                                                    <span className='leave-date'>{formatDate(new Date(req.leaveDate.replace(/-/g, '/')), { day: '2-digit', month: '2-digit'})}</span>
                                                    <span className="status-text">{statusText[req.status]}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-data-message">Không có đơn nào đang chờ duyệt.</p>
                                    )}
                                </>
                            )}
                            
                            {/* FIX: Added a new view for processed requests, displaying them as a list of styled buttons. */}
                            {leaveRequestSubTab === 'processed' && (
                                <>
                                    {processedRequests.length > 0 ? (
                                        <div className="processed-leave-buttons">
                                            {processedRequests.map(req => (
                                                <button key={req.id} className={`processed-leave-btn status-${req.status}`} onClick={() => handleOpenLeaveRequestModal(req)}>
                                                    <span className='student-name'>{req.studentName}</span>
                                                    <span className='leave-date'>{formatDate(new Date(req.leaveDate.replace(/-/g, '/')), { day: '2-digit', month: '2-digit'})}</span>
                                                    <span className={`status-text`}>{statusText[req.status]}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-data-message">Chưa có đơn nào được xử lý.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            }
            case 'reports': {
                const studentsForReport = reportType === 'day' 
                    ? (currentWeekData[reportValue]?.[reportSession] ?? [])
                    : Object.keys(currentWeekData)
                        .filter(date => date.startsWith(reportValue.slice(0, 7)))
                        .flatMap(date => currentWeekData[date]?.[reportSession] ?? []);
                
                const stats = {
                    total: studentsForReport.length,
                    present: studentsForReport.filter(s => s.status === 'present').length,
                    late: studentsForReport.filter(s => s.status === 'late').length,
                    absent_p: studentsForReport.filter(s => s.status === 'absent_p').length,
                    absent_np: studentsForReport.filter(s => s.status === 'absent_np').length,
                    unrecognized: studentsForReport.filter(s => s.status === 'unrecognized').length,
                };
                const totalAbsent = stats.absent_p + stats.absent_np;

                const chartData = [
                    { label: 'Có mặt', value: stats.present, color: 'var(--status-present)' },
                    { label: 'Đi muộn', value: stats.late, color: 'var(--status-late)' },
                    { label: 'Vắng CP', value: stats.absent_p, color: 'var(--status-absent_p)' },
                    { label: 'Vắng KP', value: stats.absent_np, color: 'var(--status-absent_np)' },
                    { label: 'Chưa DD', value: stats.unrecognized, color: 'var(--status-unrecognized)' },
                ];
                const maxChartValue = Math.max(...chartData.map(d => d.value), 1); 

                const studentsToFilter = studentsForReport.filter(student =>
                    student.name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
                    student.id.toLowerCase().includes(reportSearchTerm.toLowerCase())
                );
                
                const filteredStudents = [...studentsToFilter].sort((a, b) => {
                    if (a.status === 'unrecognized' && b.status !== 'unrecognized') return -1;
                    if (a.status !== 'unrecognized' && b.status === 'unrecognized') return 1;
                    return a.name.localeCompare(b.name, 'vi');
                });
                
                const handleExport = () => {
                    if (filteredStudents.length === 0) {
                        alert('Không có dữ liệu để xuất.');
                        return;
                    }
            
                    const headers = ['STT', 'Họ và tên', 'Mã HS', 'Trạng thái'];
                    const csvContent = [
                        headers.join(','),
                        ...filteredStudents.map((student, index) => [
                            index + 1,
                            `"${student.name}"`,
                            student.id,
                            statusOptions[student.status]
                        ].join(','))
                    ].join('\n');
            
                    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    const todayStr = new Date().toISOString().slice(0, 10);
                    link.setAttribute('download', `Bao_cao_diem_danh_${todayStr}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };


                return (
                    <div className="reports-container">
                        <h2 className="content-title">Báo cáo và Thống kê</h2>

                        <div className="reports-header">
                            <div className="filter-group">
                                <label htmlFor="report-type">Xem theo</label>
                                <select id="report-type" className="filter-select" value={reportType} onChange={e => setReportType(e.target.value)}>
                                    <option value="day">Ngày</option>
                                    <option value="month">Tháng</option>
                                </select>
                            </div>
                            {reportType === 'day' ? (
                                <div className="filter-group">
                                    <label>Ngày</label>
                                    <input type="date" className="filter-input" value={reportValue} onChange={e => setReportValue(e.target.value)} />
                                </div>
                            ) : (
                                <div className="filter-group">
                                    <label>Tháng</label>
                                    <input type="month" className="filter-input" value={reportValue.slice(0, 7)} onChange={e => setReportValue(e.target.value + '-01')} />
                                </div>
                            )}
                            <div className="filter-group">
                                <label htmlFor="report-session">Buổi</label>
                                <select id="report-session" className="filter-select" value={reportSession} onChange={e => setReportSession(e.target.value as any)}>
                                    <option value="am">Sáng</option>
                                    <option value="pm">Chiều</option>
                                </select>
                            </div>
                            <div className="filter-group student-search">
                                <input type="text" id="student-search" placeholder="Tìm theo tên hoặc mã HS..." value={reportSearchTerm} onChange={e => setReportSearchTerm(e.target.value)} />
                                <SearchIcon/>
                            </div>
                            <button className="export-button" onClick={handleExport}>
                                <DownloadIcon /> Xuất Excel/PDF
                            </button>
                        </div>

                        <div className="report-stats-grid">
                            <div className="report-stat-card">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Sĩ số</div>
                            </div>
                            <div className="report-stat-card present">
                                <div className="stat-value">{stats.present}</div>
                                <div className="stat-label">Có mặt</div>
                            </div>
                            <div className="report-stat-card late">
                                <div className="stat-value">{stats.late}</div>
                                <div className="stat-label">Đi muộn</div>
                            </div>
                            <div className="report-stat-card absent">
                                <div className="stat-value">{totalAbsent}</div>
                                <div className="stat-label">Vắng</div>
                            </div>
                            <div className="report-stat-card absent-np">
                                <div className="stat-value">{stats.absent_np}</div>
                                <div className="stat-label">Vắng không phép</div>
                            </div>
                        </div>

                        <div className="scrollable-list">
                            <div className="report-content-grid">
                                <div className="report-chart-container card">
                                    <h3>Biểu đồ điểm danh ngày {formatDate(new Date())}</h3>
                                    <div className="chart">
                                        <div className="chart-y-axis">
                                            <span>{maxChartValue}</span>
                                            <span>{Math.round(maxChartValue / 2)}</span>
                                            <span>0</span>
                                        </div>
                                        <div className="chart-bars">
                                            {chartData.map(item => (
                                                <div key={item.label} className="chart-bar-group">
                                                    <div 
                                                        className="chart-bar" 
                                                        style={{ 
                                                            height: `${(item.value / maxChartValue) * 100}%`,
                                                            backgroundColor: item.color 
                                                        }}
                                                        title={`${item.label}: ${item.value}`}
                                                    >
                                                        <span className="bar-value">{item.value}</span>
                                                    </div>
                                                    <div className="bar-label">{item.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="report-table-container card">
                                    <h3>Bảng chi tiết điểm danh</h3>
                                    <div className="table-wrapper-scroll">
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>STT</th>
                                                    <th>Họ và tên</th>
                                                    <th>Mã HS</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredStudents.map((student, index) => (
                                                    <tr key={student.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{student.name}</td>
                                                        <td>{student.id}</td>
                                                        <td>
                                                            <span className={`status-badge status-${student.status}`}>
                                                                {statusOptions[student.status]}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            default:
                return <div className="card"><p>Nội dung cho mục "{menu[activeTab]?.label}" đang được xây dựng.</p></div>;
        }
    }
    
    return (
        <Dashboard role="Giáo viên" onBack={onBack} onOpenWorkflow={onOpenWorkflow} onOpenTestCases={onOpenTestCases} notifications={mockNotifications}>
            <div className="dashboard-layout">
                <nav className="sidebar">
                    {/* FIX: Destructuring `badge` was causing a type error as it's not present on all menu items. The map now iterates over the `item` object and uses a type guard to safely access the optional `badge` property. */}
                    {Object.entries(menu).map(([key, item]) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`sidebar-item ${activeTab === key ? 'active' : ''}`}>
                            {item.icon} 
                            <span>{item.label}</span>
                            {'badge' in item && item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <main className={`main-content ${activeTab === 'recognition-history' ? 'alt-bg' : ''} ${faceRegTab === 'recognition' && activeTab === 'face-registration' ? 'recognition-bg' : ''}`}>{renderContent()}</main>
            </div>
             <Modal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                title="Lý do từ chối đơn nghỉ"
                footer={
                    <>
                        <button className="action-button" onClick={() => setIsRejectionModalOpen(false)}>Hủy</button>
                        <button className="action-button primary" onClick={confirmDenyRequest}>Xác nhận từ chối</button>
                    </>
                }
            >
                <div className="form-group">
                    <label htmlFor="rejection-reason">Nhập lý do từ chối:</label>
                    <textarea 
                        id="rejection-reason" 
                        rows={4} 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ví dụ: Lý do không chính đáng, trùng lịch thi..."
                    />
                </div>
            </Modal>
             <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Thông báo"
                footer={
                    <button 
                        className="action-button primary" 
                        onClick={() => setShowSuccessModal(false)}
                    >
                        Đóng
                    </button>
                }
            >
                <p style={{textAlign: 'center'}}>{successMessage}</p>
            </Modal>
            {isUploadModalOpen && selectedTeacher && (
                <div className="modal-overlay" onClick={handleCloseUploadModal}>
                    <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header purple">
                            <h3>Ảnh khuôn mặt - {selectedTeacher.name}</h3>
                            <button onClick={handleCloseUploadModal} className="close-button">&times;</button>
                        </div>
                        <div className="modal-body upload-modal-body">
                             <input
                                type="file"
                                ref={originalPhotoInputRef}
                                onChange={handleOriginalPhotoFileChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                                multiple
                            />
                             {selectedTeacher.requiresPhotoUpdate && (
                                <div className="update-required-alert">
                                    <WarningIcon />
                                    <div>
                                        <h4>Yêu cầu cập nhật ảnh</h4>
                                        <p>Hình ảnh cũ không đạt chất lượng nhận diện, vui lòng cập nhật ảnh chân dung sắc nét, rõ khuôn mặt.</p>
                                    </div>
                                </div>
                             )}
                            <div className="upload-card">
                                <p>Thêm hoặc xóa ảnh khuôn mặt học sinh. Các thay đổi sẽ được lưu trực tiếp.</p>
                                <div className="student-info-grid">
                                    <div>
                                        <label>Mã học sinh:</label>
                                        <span>{selectedTeacher.teacherId}</span>
                                    </div>
                                    <div>
                                        <label>Họ và tên:</label>
                                        <span>{selectedTeacher.name}</span>
                                    </div>
                                </div>
                            </div>

                             <div className="upload-card">
                                <div className="section-header">
                                    <h4>Ảnh hiện có ({selectedTeacher.photoCount + modalImages.length} ảnh)</h4>
                                    <span>Tối đa 5 ảnh cho mỗi học sinh.</span>
                                </div>
                                {selectedTeacher.photoCount === 0 && modalImages.length === 0 ? (
                                    <div className="photo-grid-placeholder">
                                         <ImageIcon />
                                        <p>Chưa có ảnh nào cho học sinh này.</p>
                                    </div>
                                ) : (
                                    <div className="rec-results-grid">
                                        {/* Placeholder for existing images */}
                                        {modalImages.map((imgSrc, index) => (
                                            <img key={index} src={imgSrc} alt={`New preview ${index + 1}`} className="rec-image-preview" />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="upload-card">
                                <h4>Thêm ảnh khuôn mặt</h4>
                                <div className="add-photo-buttons">
                                    <button className="add-photo-btn" onClick={mockCamera}><CameraIcon /> Chụp ảnh</button>
                                    <button className="add-photo-btn" onClick={handleOriginalPhotoUploadClick}><UploadIcon /> Chọn ảnh</button>
                                </div>
                                <p className="info-text">
                                    <InfoIcon />
                                    <span>Bạn có thể chọn nhiều ảnh cùng lúc. Mỗi ảnh tối đa 10MB. Hỗ trợ định dạng: JPG, PNG, GIF, WEBP</span>
                                </p>
                                <div className="instructions-section">
                                    <div className="instructions-header">
                                      <InfoIcon />
                                      <div>
                                        <h5>Hướng dẫn chụp ảnh khuôn mặt</h5>
                                        <p>Chụp ảnh chính diện để đạt độ chính xác cao nhất</p>
                                      </div>
                                    </div>
                                    <div className="instructions-body">
                                       <FaceOutlineIcon />
                                       <p>Nhìn thẳng vào camera, khuôn mặt rõ ràng và đủ ánh sáng</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                           <button className="action-button" onClick={handleCloseUploadModal}>Hủy</button>
                           <button className="action-button primary" onClick={handleSaveOriginalPhotos} disabled={modalImages.length === 0}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
            <Modal
                isOpen={isLeaveRequestModalOpen}
                onClose={handleCloseLeaveRequestModal}
                title="Chi tiết Đơn xin nghỉ"
                footer={<>
                    {selectedLeaveRequest?.status === 'pending' && (
                        <>
                            <button className="action-button deny" onClick={() => { if(selectedLeaveRequest) { handleDenyRequest(selectedLeaveRequest.id); handleCloseLeaveRequestModal(); }}}>
                                <XCircleIcon /> Từ chối
                            </button>
                            <button className="action-button primary approve" onClick={() => { if(selectedLeaveRequest) { handleApproveRequest(selectedLeaveRequest.id); handleCloseLeaveRequestModal(); }}}>
                                <CheckCircleIcon /> Duyệt
                            </button>
                        </>
                    )}
                    <button className="action-button" onClick={handleCloseLeaveRequestModal}>
                       {selectedLeaveRequest?.status === 'pending' ? 'Để sau' : 'Đóng'}
                    </button>
                </>}
            >
                {selectedLeaveRequest && (
                    <div className="leave-request-details">
                        <div className="detail-item">
                            <span className="detail-label">Học sinh:</span>
                            <span className="detail-value">{selectedLeaveRequest.studentName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Phụ huynh:</span>
                            <span className="detail-value">{selectedLeaveRequest.parentName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Ngày nghỉ:</span>
                            <span className="detail-value">{formatDate(new Date(selectedLeaveRequest.leaveDate.replace(/-/g, '/')))}</span>
                        </div>
                         <div className="detail-item">
                            <span className="detail-label">Lý do:</span>
                            <p className="detail-value reason">{selectedLeaveRequest.reason}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </Dashboard>
    );
};

const ParentView = ({ onBack, onOpenWorkflow, onOpenTestCases, attendanceConfig }: { onBack: () => void; onOpenWorkflow: () => void; onOpenTestCases: () => void; attendanceConfig: AttendanceConfig }) => {
    const [activeTab, setActiveTab] = useState('today');
    const [reportType, setReportType] = useState('month');
    const [showAbsentDaysModal, setShowAbsentDaysModal] = useState(false);
    const [absentDays, setAbsentDays] = useState<any[]>([]);
    const [showLateDaysModal, setShowLateDaysModal] = useState(false);
    const [lateDays, setLateDays] = useState<any[]>([]);

    // --- Student-specific data ---
    const studentId = 'HS002';
    const studentName = 'Trần Thị Bình';
    const relevantNotifications = mockNotifications.filter(n => !n.studentId || n.studentId === studentId);
    
    const menu = {
        'today': { label: 'Điểm danh hôm nay', icon: <UserCheckIcon /> },
        'leave-request': { label: 'Đơn xin nghỉ', icon: <MailIcon /> },
        'reports': { label: 'Báo cáo', icon: <FileTextIcon /> },
    };

     const renderContent = () => {
        switch(activeTab) {
            case 'today': {
                const todayRecord = mockHistoryData.find(h => h.date === formatDateForID(today));
                
                const getStatus = (session: 'am' | 'pm') => {
                    if (todayRecord) {
                        return todayRecord.sessions[session].find(s => s.id === studentId);
                    }
                    // Fallback for today if not in history yet
                    return mockStudentsData.find(s => s.id === studentId);
                };

                const amStatus = getStatus('am');
                const pmStatus = getStatus('pm');
                
                return <div className="card">
                    <h3>Trạng thái điểm danh hôm nay ({formatDate(today)}) - {studentName}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: attendanceConfig.entryMethod === 'session' ? '1fr 1fr' : '1fr', gap: '16px', marginTop: '16px' }}>
                        <div className="session-status-box" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f0f7ff', borderColor: '#cce4ff' }}>
                            <h4 style={{ marginBottom: '12px', color: '#0056b3', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{attendanceConfig.entryMethod === 'session' ? 'Buổi Sáng' : 'Hôm nay'}</h4>
                            {amStatus ? (
                                <p className={`status-badge status-${amStatus.status}`} style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-block', backgroundColor: amStatus.status === 'present' ? '#007bff' : undefined, color: amStatus.status === 'present' ? 'white' : undefined }}>
                                    {statusOptions[amStatus.status]}
                                </p>
                            ) : (
                                <p className="status-badge status-unrecognized" style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-block' }}>Chưa có dữ liệu</p>
                            )}
                        </div>
                        {attendanceConfig.entryMethod === 'session' && (
                            <div className="session-status-box" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f0f7ff', borderColor: '#cce4ff' }}>
                                <h4 style={{ marginBottom: '12px', color: '#0056b3', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buổi Chiều</h4>
                                {pmStatus ? (
                                    <p className={`status-badge status-${pmStatus.status}`} style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-block', backgroundColor: pmStatus.status === 'present' ? '#007bff' : undefined, color: pmStatus.status === 'present' ? 'white' : undefined }}>
                                        {statusOptions[pmStatus.status]}
                                    </p>
                                ) : (
                                    <p className="status-badge status-unrecognized" style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-block' }}>Chưa có dữ liệu</p>
                                )}
                            </div>
                        )}
                    </div>
                    <p style={{ marginTop: '24px' }}><strong>Ghi chú từ giáo viên:</strong> Không có.</p>
                </div>;
            }
            case 'leave-request': {
                const studentLeaveRequests = mockLeaveRequestsData.filter(req => req.studentId === studentId);
                const statusText: Record<LeaveRequestStatus, string> = {
                    pending: 'Chờ duyệt',
                    approved: 'Đã duyệt',
                    rejected: 'Bị từ chối',
                };

                 return <div className="card">
                    <h3>Gửi đơn xin nghỉ</h3>
                    <form className="leave-form">
                        <div className="form-group">
                            <label htmlFor="leave-date">Ngày nghỉ</label>
                            <input type="date" id="leave-date" defaultValue={formatDateForID(new Date())}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="leave-reason">Lý do</label>
                            <textarea id="leave-reason" rows={4} placeholder="Vui lòng nêu rõ lý do..."></textarea>
                        </div>
                        <button type="submit" className="action-button primary">Gửi đơn</button>
                    </form>
                    <div className="sub-section">
                        <h4>Lịch sử đơn xin nghỉ</h4>
                        {studentLeaveRequests.length > 0 ? (
                             <ul className="student-list compact">
                                {studentLeaveRequests.map((req) => (
                                    <li key={req.id}>
                                        <span>Đơn ngày: {formatDate(new Date(req.leaveDate.replace(/-/g, '/')), { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                        <span className={`status-badge status-${req.status}`}>{statusText[req.status]}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Chưa có đơn nào được gửi.</p>
                        )}
                    </div>
                 </div>;
            }
            case 'reports': {
                const reportData: Array<{date: string, session: string, status: AttendanceStatus}> = [];
                mockHistoryData.forEach(record => {
                    const am_status = record.sessions.am.find(s => s.id === studentId)?.status;
                    if(am_status) reportData.push({ date: record.date, session: 'Sáng', status: am_status });
                    const pm_status = record.sessions.pm.find(s => s.id === studentId)?.status;
                    if(pm_status) reportData.push({ date: record.date, session: 'Chiều', status: pm_status });
                });


                const stats = {
                    totalSessions: reportData.length,
                    presentSessions: reportData.filter(r => r.status === 'present').length,
                    absentSessions: reportData.filter(r => r.status.startsWith('absent')).length,
                    lateSessions: reportData.filter(r => r.status === 'late').length,
                };

                return (
                    <div className="reports-container">
                        <h2 className="content-title">Báo cáo chuyên cần - {studentName}</h2>
        
                        <div className="reports-header">
                            <div className="filter-group">
                                <label htmlFor="parent-report-type">Xem theo</label>
                                <select id="parent-report-type" className="filter-select" value={reportType} onChange={e => setReportType(e.target.value)}>
                                    <option value="week">Tuần</option>
                                    <option value="month">Tháng</option>
                                    <option value="semester">Học kỳ</option>
                                    <option value="year">Năm học</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                {reportType === 'week' && <input type="week" />}
                                {reportType === 'month' && <input type="month" />}
                                {reportType === 'semester' && (
                                    <select className="filter-select">
                                        <option>Học kỳ I</option>
                                        <option>Học kỳ II</option>
                                    </select>
                                )}
                                {reportType === 'year' && (
                                    <select className="filter-select">
                                        <option>2024-2025</option>
                                        <option>2025-2026</option>
                                    </select>
                                )}
                            </div>
                            <button className="export-button">
                                <DownloadIcon /> Xuất Báo cáo
                            </button>
                        </div>
        
                        <div className="report-stats-grid">
                            <div className="report-stat-card">
                                <div className="stat-value">{stats.totalSessions}</div>
                                <div className="stat-label">Tổng số buổi học</div>
                            </div>
                            <div className="report-stat-card present">
                                <div className="stat-value">{stats.presentSessions}</div>
                                <div className="stat-label">Số buổi có mặt</div>
                            </div>
                            <div className="report-stat-card late clickable" onClick={() => {
                                const lateData = reportData.filter(r => r.status === 'late');
                                setLateDays(lateData);
                                setShowLateDaysModal(true);
                            }}>
                                <div className="stat-value">{stats.lateSessions}</div>
                                <div className="stat-label">Số buổi đi trễ</div>
                                <div className="click-hint">Bấm để xem chi tiết</div>
                            </div>
                            <div className="report-stat-card absent clickable" onClick={() => {
                                const absentData = reportData.filter(r => r.status.startsWith('absent'));
                                setAbsentDays(absentData);
                                setShowAbsentDaysModal(true);
                            }}>
                                <div className="stat-value">{stats.absentSessions}</div>
                                <div className="stat-label">Số buổi vắng</div>
                                <div className="click-hint">Bấm để xem chi tiết</div>
                            </div>
                        </div>
        
                        <div className="card" style={{ marginTop: '24px' }}>
                            <h3>Chi tiết điểm danh</h3>
                            <div className="table-wrapper-scroll">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Ngày</th>
                                            <th>Buổi</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((record, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(new Date(record.date.replace(/-/g, '/')), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                                <td>{record.session}</td>
                                                <td>
                                                    <span className={`status-badge status-${record.status}`}>
                                                        {statusOptions[record.status as AttendanceStatus]}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            }
            default:
                return <div className="card"><p>Nội dung cho mục "{menu[activeTab]?.label}" đang được xây dựng.</p></div>;
        }
    }

    return (
        <Dashboard role="Phụ huynh" onBack={onBack} onOpenWorkflow={onOpenWorkflow} onOpenTestCases={onOpenTestCases} notifications={relevantNotifications}>
             <div className="dashboard-layout">
                <nav className="sidebar">
                    {Object.entries(menu).map(([key, {label, icon}]) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`sidebar-item ${activeTab === key ? 'active' : ''}`}>
                            {icon} <span>{label}</span>
                        </button>
                    ))}
                </nav>
                <main className="main-content">{renderContent()}</main>
            </div>
            <Modal
                isOpen={showAbsentDaysModal}
                onClose={() => setShowAbsentDaysModal(false)}
                title="Chi tiết các ngày vắng mặt"
                footer={<button className="action-button primary" onClick={() => setShowAbsentDaysModal(false)}>Đóng</button>}
            >
                <div className="table-wrapper-scroll">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Buổi</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absentDays.length > 0 ? absentDays.map((day, idx) => (
                                <tr key={idx}>
                                    <td>{formatDate(new Date(day.date.replace(/-/g, '/')), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                    <td>{day.session}</td>
                                    <td>
                                        <span className={`status-badge status-${day.status}`}>
                                            {statusOptions[day.status as AttendanceStatus]}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} style={{textAlign: 'center', padding: '20px'}}>Không có dữ liệu vắng mặt.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
            <Modal
                isOpen={showLateDaysModal}
                onClose={() => setShowLateDaysModal(false)}
                title="Chi tiết các ngày đi trễ"
                footer={<button className="action-button primary" onClick={() => setShowLateDaysModal(false)}>Đóng</button>}
            >
                <div className="table-wrapper-scroll">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Buổi</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lateDays.length > 0 ? lateDays.map((day, idx) => (
                                <tr key={idx}>
                                    <td>{formatDate(new Date(day.date.replace(/-/g, '/')), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                    <td>{day.session}</td>
                                    <td>
                                        <span className={`status-badge status-${day.status}`}>
                                            {statusOptions[day.status as AttendanceStatus]}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} style={{textAlign: 'center', padding: '20px'}}>Không có dữ liệu đi trễ.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </Dashboard>
    );
};

const StudentView = ({ onBack, onOpenWorkflow, onOpenTestCases, attendanceConfig }: { onBack: () => void; onOpenWorkflow: () => void; onOpenTestCases: () => void; attendanceConfig: AttendanceConfig }) => {
    const [activeTab, setActiveTab] = useState('today');
    const [reportType, setReportType] = useState('month');

    // --- Student-specific data ---
    const studentId = 'HS002';
    const studentName = 'Trần Thị Bình';
    const relevantNotifications = mockNotifications.filter(n => !n.studentId || n.studentId === studentId);
    
    const menu = {
        'today': { label: 'Điểm danh hôm nay', icon: <UserCheckIcon /> },
        'notifications': { label: 'Thông báo', icon: <BellIcon /> },
        'reports': { label: 'Báo cáo', icon: <FileTextIcon /> },
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'today': {
                 const todayRecord = mockHistoryData.find(h => h.date === formatDateForID(today));
                const currentHour = new Date().getHours();
                const session: 'am' | 'pm' = currentHour < 12 ? 'am' : 'pm';
                let studentTodayStatus: Student | undefined;
                if (todayRecord) {
                    studentTodayStatus = todayRecord.sessions[session].find(s => s.id === studentId);
                } else {
                    studentTodayStatus = mockStudentsData.find(s => s.id === studentId)
                }
                
                return <div className="card">
                    <h3>Trạng thái điểm danh hôm nay ({formatDate(today)}) của bạn</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: '16px' }}>
                        <div className="session-status-box" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f0f7ff', borderColor: '#cce4ff' }}>
                            <h4 style={{ marginBottom: '12px', color: '#0056b3', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{attendanceConfig.entryMethod === 'session' ? `Buổi ${session === 'am' ? 'Sáng' : 'Chiều'}` : 'Hôm nay'}</h4>
                            {studentTodayStatus ? (
                                <p className={`status-badge status-${studentTodayStatus.status}`} style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-block', backgroundColor: studentTodayStatus.status === 'present' ? '#007bff' : undefined, color: studentTodayStatus.status === 'present' ? 'white' : undefined }}>
                                    {statusOptions[studentTodayStatus.status]}
                                </p>
                            ) : (
                                <p className="status-badge status-unrecognized" style={{ fontSize: '1rem', padding: '8px 16px', display: 'inline-block' }}>Chưa có dữ liệu</p>
                            )}
                        </div>
                    </div>
                </div>;
            }
            case 'notifications': {
                const getIconForType = (type: 'warning' | 'info') => {
                    switch (type) {
                        case 'warning': return <WarningIcon />;
                        case 'info': return <InfoIcon />;
                        default: return null;
                    }
                };

                 return <div className="card">
                    <h3>Thông báo của bạn</h3>
                     <ul className="notification-list full-page">
                        {relevantNotifications.length > 0 ? relevantNotifications.map(notif => (
                            <li key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                                <div className={`notification-icon icon-${notif.type}`}>
                                    {getIconForType(notif.type)}
                                </div>
                                <div className="notification-content">
                                    <p className="notification-title">{notif.title}</p>
                                    <p className="notification-message">{notif.message}</p>
                                    <p className="notification-timestamp">{notif.timestamp}</p>
                                </div>
                            </li>
                        )) : <li className="notification-empty">Bạn không có thông báo nào.</li>}
                    </ul>
                 </div>;
            }
            case 'reports': {
                const reportData: Array<{date: string, session: string, status: AttendanceStatus}> = [];
                mockHistoryData.forEach(record => {
                    const am_status = record.sessions.am.find(s => s.id === studentId)?.status;
                    if(am_status) reportData.push({ date: record.date, session: 'Sáng', status: am_status });
                    const pm_status = record.sessions.pm.find(s => s.id === studentId)?.status;
                    if(pm_status) reportData.push({ date: record.date, session: 'Chiều', status: pm_status });
                });


                const stats = {
                    totalSessions: reportData.length,
                    presentSessions: reportData.filter(r => r.status === 'present').length,
                    absentSessions: reportData.filter(r => r.status.startsWith('absent')).length,
                };

                return (
                    <div className="reports-container">
                        <h2 className="content-title">Báo cáo chuyên cần của bạn</h2>
        
                        <div className="reports-header">
                            <div className="filter-group">
                                <label htmlFor="student-report-type">Xem theo</label>
                                <select id="student-report-type" className="filter-select" value={reportType} onChange={e => setReportType(e.target.value)}>
                                    <option value="week">Tuần</option>
                                    <option value="month">Tháng</option>
                                    <option value="semester">Học kỳ</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                {reportType === 'week' && <input type="week" />}
                                {reportType === 'month' && <input type="month" />}
                                {reportType === 'semester' && (
                                    <select className="filter-select">
                                        <option>Học kỳ I</option>
                                        <option>Học kỳ II</option>
                                    </select>
                                )}
                            </div>
                            <button className="export-button">
                                <DownloadIcon /> Xuất Báo cáo
                            </button>
                        </div>
        
                        <div className="report-stats-grid">
                            <div className="report-stat-card">
                                <div className="stat-value">{stats.totalSessions}</div>
                                <div className="stat-label">Tổng số buổi học</div>
                            </div>
                            <div className="report-stat-card present">
                                <div className="stat-value">{stats.presentSessions}</div>
                                <div className="stat-label">Số buổi có mặt</div>
                            </div>
                            <div className="report-stat-card absent">
                                <div className="stat-value">{stats.absentSessions}</div>
                                <div className="stat-label">Số buổi vắng</div>
                            </div>
                        </div>
        
                        <div className="card" style={{ marginTop: '24px' }}>
                            <h3>Chi tiết điểm danh</h3>
                            <div className="table-wrapper-scroll">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Ngày</th>
                                            <th>Buổi</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((record, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(new Date(record.date.replace(/-/g, '/')), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                                <td>{record.session}</td>
                                                <td>
                                                    <span className={`status-badge status-${record.status}`}>
                                                        {statusOptions[record.status as AttendanceStatus]}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            }
            default:
                return <div className="card"><p>Nội dung cho mục "{menu[activeTab]?.label}" đang được xây dựng.</p></div>;
        }
    }

    return (
        <Dashboard role="Học sinh" onBack={onBack} onOpenWorkflow={onOpenWorkflow} onOpenTestCases={onOpenTestCases} notifications={relevantNotifications}>
            <div className="dashboard-layout">
                <nav className="sidebar">
                    {Object.entries(menu).map(([key, {label, icon}]) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`sidebar-item ${activeTab === key ? 'active' : ''}`}>
                           {icon} <span>{label}</span>
                        </button>
                    ))}
                </nav>
                <main className="main-content">{renderContent()}</main>
            </div>
        </Dashboard>
    );
};


// --- WORKFLOW MODAL ---
const workflowData = {
    teacher: {
        title: "Giáo viên",
        icon: <BriefcaseIcon/>,
        description: "Vai trò quản lý & thực thi, tập trung vào việc vận hành và kiểm soát dữ liệu.",
        steps: [
            { icon: <FaceIdIcon/>, title: "Bước 1: Chuẩn bị dữ liệu khuôn mặt", tasks: ["Upload ảnh gốc và ảnh nhận diện của học sinh.", "Cập nhật hoặc bổ sung nếu dữ liệu cũ bị lỗi hoặc thay đổi.", "Quản lý kho ảnh khuôn mặt để đảm bảo hệ thống nhận diện chính xác."] },
            { icon: <BuildingIcon/>, title: "Bước 2: Theo dõi tổng quan", tasks: ["Truy cập \"Lịch sử nhận diện\" để nắm bắt tình hình chung của lớp."] },
            { icon: <UserCheckIcon/>, title: "Bước 3: Thực hiện điểm danh", tasks: ["Kiểm tra danh sách học sinh.", "Xác định trạng thái (hiện diện/vắng mặt).", "Xử lý các trường hợp hệ thống không nhận diện được học sinh.", "Kiểm tra các đơn xin nghỉ đã được gửi từ phụ huynh.", "Lưu và xác nhận kết quả điểm danh cuối cùng."] },
            { icon: <FileTextIcon/>, title: "Bước 4: Quản lý lịch sử và Báo cáo", tasks: ["Tra cứu lịch sử điểm danh theo lớp hoặc từng học sinh cụ thể.", "Xuất dữ liệu/báo cáo để phục vụ công tác quản lý của nhà trường."] }
        ]
    },
    parent: {
        title: "Phụ huynh",
        icon: <UsersIcon/>,
        description: "Vai trò giám sát & phối hợp, theo dõi sát sao tình hình đi học của con.",
        steps: [
            { icon: <UserCheckIcon/>, title: "Bước 1: Kiểm tra tình trạng hàng ngày", tasks: ["Vào \"Điểm danh hôm nay\" để xem con đã đến lớp chưa.", "Xem các ghi chú từ giáo viên (nếu có)."] },
            { icon: <MailIcon/>, title: "Bước 2: Gửi yêu cầu nghỉ học", tasks: ["Gửi đơn xin nghỉ trực tiếp qua hệ thống.", "Theo dõi trạng thái đơn (đã được duyệt hay chưa)."] },
            { icon: <HistoryIcon/>, title: "Bước 3: Tra cứu lịch sử", tasks: ["Xem lại lịch sử điểm danh của con theo ngày hoặc theo tháng."] }
        ]
    },
    student: {
        title: "Học sinh",
        icon: <UserIcon/>,
        description: "Vai trò thực hiện & nhận thông tin, là đối tượng trung tâm của việc điểm danh.",
        steps: [
            { icon: <FaceIdIcon/>, title: "Bước 1: Thực hiện điểm danh", tasks: ["Thực hiện thao tác điểm danh (thường là qua nhận diện khuôn mặt).", "Xem trạng thái điểm danh của mình trong ngày hôm nay."] },
            { icon: <HistoryIcon/>, title: "Bước 2: Theo dõi lịch sử", tasks: ["Xem lại lịch sử chuyên cần cá nhân."] },
            { icon: <BellIcon/>, title: "Bước 3: Tiếp nhận thông báo", tasks: ["Nhận các thông báo liên quan đến việc điểm danh từ nhà trường hoặc giáo viên."] }
        ]
    }
}

const WorkflowModalContent = () => {
    const [activeRole, setActiveRole] = useState<Role>('teacher');
    
    const activeWorkflow = workflowData[activeRole];

    return (
        <div className="workflow-container">
            <div className="workflow-tabs">
                {(Object.keys(workflowData) as Role[]).map(role => (
                    <button 
                        key={role} 
                        className={`workflow-tab-button ${activeRole === role ? 'active' : ''}`}
                        onClick={() => setActiveRole(role)}
                    >
                        {workflowData[role].icon}
                        <span>{workflowData[role].title}</span>
                    </button>
                ))}
            </div>

            <div className="workflow-content">
                <p className="workflow-role-description">{activeWorkflow.description}</p>
                <div className="workflow-steps">
                    {activeWorkflow.steps.map((step, index) => (
                        <div key={index} className="workflow-step">
                            <div className="workflow-step-header">
                                <div className="workflow-step-icon">{step.icon}</div>
                                <h5 className="workflow-step-title">{step.title}</h5>
                            </div>
                            <div className="workflow-step-body">
                                <ul>
                                    {step.tasks.map((task, taskIndex) => (
                                        <li key={taskIndex}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- TEST CASE MODAL ---
type TestCaseStatus = 'untested' | 'pass' | 'fail';
type Priority = 'Cao' | 'Trung bình' | 'Thấp';

interface TestCase {
    id: string;
    feature: string;
    name: string;
    steps: string[];
    expected: string;
    priority: Priority;
    status: TestCaseStatus;
}

interface TestGroup {
    role: string;
    cases: TestCase[];
}

const newInitialTestCasesData: TestGroup[] = [
  {
    role: "Giáo viên",
    cases: [
      { id: 'TC-GV-01', feature: 'Thiết lập', name: 'Đăng ký khuôn mặt mới', steps: ['Chọn học sinh', 'Upload/Chụp ảnh nhận diện', 'Nhấn Lưu'], expected: 'Hệ thống báo thành công, ảnh hiển thị đúng tại hồ sơ HS', priority: 'Cao', status: 'untested' },
      { id: 'TC-GV-02', feature: 'Thực hiện', name: 'Điểm danh thủ công', steps: ['Chọn học sinh vắng mặt', 'Chỉnh trạng thái thành "Có mặt"', 'Lưu xác nhận'], expected: 'Trạng thái cập nhật tức thì, có ghi chú "GV xác nhận"', priority: 'Cao', status: 'untested' },
      { id: 'TC-GV-04', feature: 'Báo cáo', name: 'Xuất báo cáo đi làm', steps: ['Chọn thời gian', 'Nhấn "Xuất dữ liệu"'], expected: 'File Excel tải về đúng định dạng, đủ số ngày công của GV', priority: 'Trung bình', status: 'untested' },
      { id: 'TC-GV-05', feature: 'Báo cáo', name: 'Xuất báo cáo học sinh', steps: ['Chọn lớp/học sinh', 'Nhấn "Xuất báo cáo"'], expected: 'Hiển thị đủ: Tỷ lệ chuyên cần, số buổi vắng, đi muộn', priority: 'Cao', status: 'untested' },
    ]
  },
  {
    role: "Phụ huynh",
    cases: [
      { id: 'TC-PH-01', feature: 'Theo dõi', name: 'Nhận thông báo điểm danh', steps: ['Học sinh quét mặt thành công'], expected: 'Notification đẩy về điện thoại PH ngay lập tức', priority: 'Cao', status: 'untested' },
      { id: 'TC-PH-02', feature: 'Tương tác', name: 'Gửi đơn xin nghỉ', steps: ['Chọn ngày/Lý do nghỉ', 'Nhấn Gửi'], expected: 'Đơn được gửi thành công, giáo viên nhận được thông báo', priority: 'Trung bình', status: 'untested' },
      { id: 'TC-PH-03', feature: 'Báo cáo', name: 'Xem lịch sử chuyên cần', steps: ['Vào Lịch sử điểm danh theo tháng'], expected: 'Hiển thị dạng lịch màu trực quan (Xanh: Đủ, Đỏ: Vắng)', priority: 'Trung bình', status: 'untested' },
    ]
  },
  {
    role: "Học sinh",
    cases: [
      { id: 'TC-HS-01', feature: 'Thực hiện', name: 'Điểm danh AI', steps: ['Đứng trước camera nhận diện'], expected: 'Nhận diện đúng ID < 2s, hiển thị lời chào/thông báo', priority: 'Cao', status: 'untested' },
      { id: 'TC-HS-02', feature: 'Báo cáo', name: 'Xem số tiết vắng mặt', steps: ['Vào mục Báo cáo cá nhân'], expected: 'Hiển thị chính xác số tiết vắng/tổng số tiết học', priority: 'Trung bình', status: 'untested' },
    ]
  },
  {
    role: "Hệ thống (Trường hợp ngoại lệ)",
    cases: [
      { id: 'TC-EX-01', feature: 'Ngoại lệ', name: 'Điểm danh khi mất mạng', steps: ['Ngắt kết nối internet', 'Thực hiện quét mặt'], expected: 'Báo "Đã lưu offline", tự đồng bộ khi có mạng lại', priority: 'Cao', status: 'untested' },
      { id: 'TC-EX-02', feature: 'Ngoại lệ', name: 'Chặn nhận diện bằng ảnh chụp', steps: ['Đưa ảnh chân dung HS lên camera'], expected: 'Hệ thống từ chối điểm danh (Liveness Detection)', priority: 'Cao', status: 'untested' },
      { id: 'TC-EX-03', feature: 'Ngoại lệ', name: 'Xung đột Đơn nghỉ & Có mặt', steps: ['PH gửi đơn nghỉ', 'HS vẫn đến trường quét mặt'], expected: 'Ưu tiên dữ liệu quét mặt thực tế, báo cho GV kiểm tra', priority: 'Thấp', status: 'untested' },
      { id: 'TC-EX-04', feature: 'Ngoại lệ', name: 'Sai lệch múi giờ', steps: ['Đổi giờ điện thoại sai thực tế', 'Điểm danh'], expected: 'Dữ liệu ghi nhận theo giờ Server của nhà trường', priority: 'Trung bình', status: 'untested' },
    ]
  }
];

const TestCaseModalContent = () => {
    const [testData, setTestData] = useState<TestGroup[]>(newInitialTestCasesData);

    const handleStatusChange = (groupIndex: number, caseIndex: number, newStatus: TestCaseStatus) => {
        const newData = [...testData];
        const currentStatus = newData[groupIndex].cases[caseIndex].status;
        // If clicking the same status button, toggle it back to 'untested'
        newData[groupIndex].cases[caseIndex].status = currentStatus === newStatus ? 'untested' : newStatus;
        setTestData(newData);
    };

    const getPriorityClass = (priority: Priority) => {
        switch (priority) {
            case 'Cao': return 'priority-cao';
            case 'Trung bình': return 'priority-trungbinh';
            case 'Thấp': return 'priority-thap';
            default: return '';
        }
    };

    return (
        <div className="test-case-container">
            {testData.map((group, groupIndex) => (
                <div key={group.role} className="test-case-section">
                    <h4>{group.role}</h4>
                    <table className="test-case-table">
                        <thead>
                            <tr>
                                <th>Mã Case</th>
                                <th>Tính năng</th>
                                <th>Tên kịch bản</th>
                                <th>Các bước thực hiện</th>
                                <th>Kết quả mong đợi</th>
                                <th>Ưu tiên</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.cases.map((tc, caseIndex) => (
                                <tr key={tc.id}>
                                    <td>{tc.id}</td>
                                    <td>{tc.feature}</td>
                                    <td>{tc.name}</td>
                                    <td>
                                        <ul className="steps-list">
                                            {tc.steps.map((step, i) => <li key={i}>{step}</li>)}
                                        </ul>
                                    </td>
                                    <td>{tc.expected}</td>
                                    <td>
                                        <span className={`priority-badge ${getPriorityClass(tc.priority)}`}>
                                            {tc.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="status-toggle-buttons">
                                            <button 
                                                className={`pass-button ${tc.status === 'pass' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange(groupIndex, caseIndex, 'pass')}
                                            >
                                                Pass
                                            </button>
                                            <button 
                                                className={`fail-button ${tc.status === 'fail' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange(groupIndex, caseIndex, 'fail')}
                                            >
                                                Fail
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

// --- NEW REPORT DASHBOARD COMPONENT ---
interface ReportData {
  id: string;
  name: string;
  attendanceRate: number;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  classes?: ReportData[]; // Optional: For drill-down
}

// FIX: Defined getAllClasses in a shared scope to be accessible by both SchoolWideReportView and PrincipalView.
const getAllClasses = (data: ReportData[]): ReportData[] => {
    let classes: ReportData[] = [];
    data.forEach(item => {
        if (item.classes && item.classes.length > 0) {
            classes = classes.concat(getAllClasses(item.classes));
        } else {
            classes.push(item);
        }
    });
    return classes;
};

const SchoolWideReportView = ({ title, data, hideDrillDown = false }: { title: string; data: ReportData[]; hideDrillDown?: boolean }) => {
    const [period, setPeriod] = useState<'month' | 'semester' | 'year'>('month');
    const [monthValue, setMonthValue] = useState(() => new Date().toISOString().slice(0, 7));
    const [semesterValue, setSemesterValue] = useState('1');
    const [yearValue, setYearValue] = useState('2024-2025');
    const [viewStack, setViewStack] = useState([{ title, data }]);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState<any[]>([]);
    const [modalColumns, setModalColumns] = useState<{ key: string; label: string }[]>([]);

    // Export range modal state
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<'day' | 'month' | 'semester' | 'year'>('month');
    const [exportRange, setExportRange] = useState({ start: '', end: '', month: '', semester: '1', year: '2025-2026' });


    const currentView = viewStack[viewStack.length - 1];
    const dataForDisplay = currentView.data;

    const handleDrillDown = (item: ReportData) => {
        if (item.classes && item.classes.length > 0) {
            setViewStack(prev => [...prev, { title: `Chi tiết ${item.name}`, data: item.classes! }]);
        } else {
            // Show student list for this class
            setModalTitle(`Danh sách học sinh - ${item.name}`);
            const className = item.name.replace('Lớp ', '');
            const studentsInClass = mockStudentsData.filter(s => s.className === className);
            
            const studentAttendanceData = studentsInClass.map((s, idx) => ({
                stt: idx + 1,
                name: s.name,
                attendanceRate: (95 + Math.random() * 5).toFixed(1) + '%',
                absent: Math.floor(Math.random() * 3),
                late: Math.floor(Math.random() * 2),
            }));

            setModalData(studentAttendanceData);
            setModalColumns([
                { key: 'stt', label: 'STT' },
                { key: 'name', label: 'Họ tên' },
                { key: 'attendanceRate', label: 'Tỉ lệ chuyên cần' },
                { key: 'absent', label: 'Vắng' },
                { key: 'late', label: 'Đi muộn' },
            ]);
            setIsDetailModalOpen(true);
        }
    };

    const handleGoBack = () => {
        if (viewStack.length > 1) {
            setViewStack(prev => prev.slice(0, -1));
        }
    };

    const rootData = viewStack[0].data;
    const allSchoolClasses = getAllClasses(rootData);

    const schoolWideTotalAbsent = allSchoolClasses.reduce((acc, item) => acc + item.absent, 0);
    const schoolWideLowAttendanceClasses = allSchoolClasses.filter(item => item.attendanceRate < 95).length;

    const currentViewTotalStudents = dataForDisplay.reduce((acc, item) => acc + item.totalStudents, 0);
    const currentViewAvgAttendance = dataForDisplay.length > 0 ? dataForDisplay.reduce((acc, item) => acc + item.attendanceRate, 0) / dataForDisplay.length : 0;

    const sortedData = [...dataForDisplay].sort((a, b) => b.attendanceRate - a.attendanceRate);

    const openAbsenceList = () => {
        setModalTitle("Thống kê lượt vắng theo Lớp");
        const sortedByAbsence = [...allSchoolClasses].sort((a, b) => b.absent - a.absent);
        setModalData(sortedByAbsence);
        setModalColumns([
            { key: 'name', label: 'Lớp' },
            { key: 'absent', label: 'Số lượt vắng' },
            { key: 'late', label: 'Đi muộn' },
            { key: 'attendanceRate', label: 'Tỉ lệ chuyên cần (%)' },
        ]);
        setIsDetailModalOpen(true);
    };

    const openAttentionList = () => {
        setModalTitle("Danh sách Lớp cần chú ý (<95% chuyên cần)");
        const lowAttendance = allSchoolClasses.filter(item => item.attendanceRate < 95)
                                              .sort((a, b) => a.attendanceRate - b.attendanceRate);
        
        // Simulate student-level data for these classes
        const studentLevelData = lowAttendance.map(cls => ({
            ...cls,
            students: [
                { name: 'Nguyễn Văn A', absentCount: 5 },
                { name: 'Trần Thị B', absentCount: 3 },
                { name: 'Lê Văn C', absentCount: 4 },
            ]
        }));

        setModalData(studentLevelData);
        setModalColumns([
            { key: 'name', label: 'Lớp' },
            { key: 'attendanceRate', label: 'Tỉ lệ (%)' },
            { key: 'students', label: 'Danh sách HS nghỉ nhiều' },
        ]);
        setIsDetailModalOpen(true);
    };

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const confirmExport = () => {
        let fileName = `Bao_cao_chuyen_can_${exportType}`;
        if (exportType === 'day') fileName += `_${exportRange.start}_den_${exportRange.end}`;
        else if (exportType === 'month') fileName += `_${exportRange.month}`;
        else if (exportType === 'semester') fileName += `_HK${exportRange.semester}`;
        else fileName += `_NamHoc_${exportRange.year}`;

        const headers = [ 'Khối/Lớp', 'Tỉ lệ chuyên cần (%)', 'Sĩ số', 'Vắng', 'Đi muộn' ];
        const csvContent = [
            headers.join(','),
            ...dataForDisplay.map(item => [
                `"${item.name}"`,
                item.attendanceRate,
                item.totalStudents,
                item.absent,
                item.late
            ].join(','))
        ].join('\n');
    
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportModalOpen(false);
    };


    return (
        <>
        <div className="report-dashboard">
            <div className="report-dashboard-header">
                <div className="report-title-group">
                     {viewStack.length > 1 && (
                        <button onClick={handleGoBack} className="report-back-button">
                            <ArrowLeftIcon />
                        </button>
                    )}
                    <h2>{currentView.title}</h2>
                </div>
                <div className="filter-controls">
                    <div className="filter-group">
                        <label htmlFor="report-period">Xem theo</label>
                        <select id="report-period" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                            <option value="month">Tháng</option>
                            <option value="semester">Học kỳ</option>
                            <option value="year">Năm học</option>
                        </select>
                    </div>
                    {period === 'month' && (
                        <div className="filter-group">
                            <input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
                        </div>
                    )}
                    {period === 'semester' && (
                        <div className="filter-group">
                            <select value={semesterValue} onChange={(e) => setSemesterValue(e.target.value)}>
                                <option value="1">Học kỳ I</option>
                                <option value="2">Học kỳ II</option>
                            </select>
                        </div>
                    )}
                    {period === 'year' && (
                        <div className="filter-group">
                            <select value={yearValue} onChange={(e) => setYearValue(e.target.value)}>
                                <option value="2024-2025">2024-2025</option>
                                <option value="2025-2026">2025-2026</option>
                            </select>
                        </div>
                    )}
                    <button className="export-button" onClick={handleExport}>
                        <DownloadIcon /> Xuất Báo cáo
                    </button>
                </div>
            </div>

            <div className="report-summary-cards">
                <div className="summary-card blue">
                    <div className="summary-value">{currentViewAvgAttendance.toFixed(1)}%</div>
                    <div className="summary-label">Chuyên cần trung bình</div>
                </div>
                <div className="summary-card green">
                    <div className="summary-value">{currentViewTotalStudents}</div>
                    <div className="summary-label">Tổng sĩ số</div>
                </div>
                <div className="summary-card orange clickable" onClick={openAbsenceList}>
                    <div className="summary-value">{schoolWideTotalAbsent}</div>
                    <div className="summary-label">Tổng lượt vắng</div>
                </div>
                <div className="summary-card red clickable" onClick={openAttentionList}>
                    <div className="summary-value">{schoolWideLowAttendanceClasses}</div>
                    <div className="summary-label">Lớp cần chú ý</div>
                </div>
            </div>

            <div className={`report-main-grid ${hideDrillDown ? 'single-column' : ''}`}>
                <div className="card chart-card">
                    <h3>Biểu đồ chuyên cần</h3>
                    <div className="horizontal-chart">
                        {sortedData.map(item => (
                            <div key={item.id} className="chart-row">
                                <span className="chart-label">{item.name}</span>
                                <div className="chart-bar-container">
                                    <div 
                                        className="chart-bar-fill" 
                                        style={{ width: `${item.attendanceRate}%`, backgroundColor: item.attendanceRate > 95 ? 'var(--status-present)' : 'var(--status-late)' }}
                                    ></div>
                                </div>
                                <span className="chart-value">{item.attendanceRate}%</span>
                            </div>
                        ))}
                    </div>
                </div>
                {!hideDrillDown && (
                    <div className="card table-card">
                        <h3>Thống kê chi tiết</h3>
                        <div className="table-wrapper-scroll">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Khối/Lớp</th>
                                        <th>Tỉ lệ chuyên cần</th>
                                        <th>Sĩ số</th>
                                        <th>Vắng</th>
                                        <th>Đi muộn</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataForDisplay.map(item => (
                                        <tr 
                                          key={item.id}
                                          onClick={() => !hideDrillDown && handleDrillDown(item)}
                                          className={!hideDrillDown && item.classes && item.classes.length > 0 ? 'drill-down' : ''}
                                        >
                                            <td>
                                                <div className="drill-down-cell">
                                                    <span>{item.name}</span>
                                                    {!hideDrillDown && item.classes && item.classes.length > 0 && <ChevronRightIcon />}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="progress-bar-cell">
                                                    <span>{item.attendanceRate}%</span>
                                                    <div className="progress-bar-container">
                                                        <div className="progress-bar-fill" style={{ width: `${item.attendanceRate}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.totalStudents}</td>
                                            <td>{item.absent}</td>
                                            <td>{item.late}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <Modal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            title="Xuất báo cáo Excel"
            footer={
                <>
                    <button className="action-button" onClick={() => setIsExportModalOpen(false)}>Hủy</button>
                    <button className="action-button primary" onClick={confirmExport}>Xuất báo cáo</button>
                </>
            }
        >
            <div className="export-form">
                <div className="form-group">
                    <label>Loại báo cáo:</label>
                    <select value={exportType} onChange={(e) => setExportType(e.target.value as any)}>
                        <option value="day">Theo ngày</option>
                        <option value="month">Theo tháng</option>
                        <option value="semester">Theo học kỳ</option>
                        <option value="year">Theo năm học</option>
                    </select>
                </div>

                {exportType === 'day' && (
                    <div className="export-date-range">
                        <div className="form-group">
                            <label>Từ ngày:</label>
                            <input type="date" value={exportRange.start} onChange={(e) => setExportRange(prev => ({ ...prev, start: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Đến ngày:</label>
                            <input type="date" value={exportRange.end} onChange={(e) => setExportRange(prev => ({ ...prev, end: e.target.value }))} />
                        </div>
                    </div>
                )}

                {exportType === 'month' && (
                    <div className="form-group">
                        <label>Chọn tháng:</label>
                        <input type="month" value={exportRange.month} onChange={(e) => setExportRange(prev => ({ ...prev, month: e.target.value }))} />
                    </div>
                )}

                {exportType === 'semester' && (
                    <div className="form-group">
                        <label>Chọn học kỳ:</label>
                        <select value={exportRange.semester} onChange={(e) => setExportRange(prev => ({ ...prev, semester: e.target.value }))}>
                            <option value="1">Học kỳ I</option>
                            <option value="2">Học kỳ II</option>
                        </select>
                    </div>
                )}

                {exportType === 'year' && (
                    <div className="form-group">
                        <label>Chọn năm học:</label>
                        <select value={exportRange.year} onChange={(e) => setExportRange(prev => ({ ...prev, year: e.target.value }))}>
                            <option value="2024-2025">2024-2025</option>
                            <option value="2025-2026">2025-2026</option>
                        </select>
                    </div>
                )}
            </div>
        </Modal>
        <Modal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            title={modalTitle}
            className="report-detail-modal"
            footer={<button className="action-button primary" onClick={() => setIsDetailModalOpen(false)}>Đóng</button>}
        >
            <div className="table-wrapper-scroll">
                <table className="report-table detail-table">
                    <thead>
                        <tr>
                            {modalColumns.map(col => <th key={col.key}>{col.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {modalData.length > 0 ? modalData.map((item, index) => (
                            <tr key={index}>
                                {modalColumns.map(col => (
                                    <td key={col.key}>
                                        {col.key === 'students' ? (
                                            <div className="student-absence-list">
                                                {item.students.map((s: any, i: number) => (
                                                    <div key={i} className="student-absence-item">
                                                        <span>{s.name}</span>: <strong>{s.absentCount} lần</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            item[col.key]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={modalColumns.length} style={{ textAlign: 'center', padding: '20px' }}>
                                    Không có dữ liệu.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Modal>
        </>
    );
};


const HeadTeacherView = ({ onBack, onOpenWorkflow, onOpenTestCases }: { onBack: () => void; onOpenWorkflow: () => void; onOpenTestCases: () => void; }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequestsData);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Rejection modal state
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [requestToReject, setRequestToReject] = useState<string | null>(null);

    const handleApproveRequest = (id: string) => {
        const request = leaveRequests.find(r => r.id === id);
        if (!request) return;
        setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        setSuccessMessage(`Đã duyệt đơn cho học sinh ${request.studentName}.`);
        setShowSuccessModal(true);
    };
    
    const handleDenyRequest = (id: string) => {
        setRequestToReject(id);
        setIsRejectionModalOpen(true);
    };

    const confirmDenyRequest = () => {
        if (!rejectionReason.trim()) {
            alert('Vui lòng nhập lý do từ chối.');
            return;
        }
        const id = requestToReject;
        const request = leaveRequests.find(r => r.id === id);
        if (!request) return;
        setLeaveRequests(prev => prev.map(r => r.id === id ? { 
            ...r, 
            status: 'rejected', 
            rejectionReason: rejectionReason,
            processedBy: 'Tổ trưởng',
            processedAt: new Date().toLocaleString('vi-VN')
        } : r));
        setSuccessMessage(`Đã từ chối đơn của học sinh ${request.studentName}.`);
        setShowSuccessModal(true);
        setIsRejectionModalOpen(false);
        setRejectionReason('');
        setRequestToReject(null);
    };


    const menu = {
        'overview': { label: 'Báo cáo tổng quan', icon: <GridIcon /> },
        'leave-requests': { label: 'Quản lý đơn nghỉ', icon: <MailIcon /> },
    };

    const mockDepartmentData: ReportData[] = [
        { id: '10A1', name: 'Lớp 10A1', attendanceRate: 95.2, totalStudents: 40, present: 38, absent: 2, late: 1 },
        { id: '10A2', name: 'Lớp 10A2', attendanceRate: 98.1, totalStudents: 38, present: 37, absent: 1, late: 0 },
        { id: '10A3', name: 'Lớp 10A3', attendanceRate: 92.5, totalStudents: 41, present: 38, absent: 3, late: 2 },
        { id: '10A4', name: 'Lớp 10A4', attendanceRate: 99.0, totalStudents: 39, present: 39, absent: 0, late: 1 },
        { id: '10A5', name: 'Lớp 10A5', attendanceRate: 94.8, totalStudents: 40, present: 38, absent: 2, late: 0 },
    ];
    const pendingRequests = leaveRequests.filter(r => r.status === 'pending');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <SchoolWideReportView title="Báo cáo Tổng quan các lớp phụ trách" data={mockDepartmentData} />;
            case 'leave-requests':
                 return (
                    <div className="leave-approval-container">
                        <h3>Đơn nghỉ chờ duyệt ({pendingRequests.length})</h3>
                         {pendingRequests.length > 0 ? (
                            <div className="processed-leave-buttons">
                                {pendingRequests.map(req => (
                                    <button key={req.id} className="processed-leave-btn status-pending" onClick={() => handleOpenLeaveRequestModal(req)}>
                                        <span className='student-name'>{req.studentName} (Lớp 10A1)</span>
                                        <span className='leave-date'>{formatDate(new Date(req.leaveDate.replace(/-/g, '/')), { day: '2-digit', month: '2-digit'})}</span>
                                        <span className="status-text">Chờ duyệt</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data-message">Không có đơn nào đang chờ duyệt.</p>
                        )}
                    </div>
                );
            default: return null;
        }
    }
    
    return (
        <Dashboard role="Tổ trưởng" onBack={onBack} onOpenWorkflow={onOpenWorkflow} onOpenTestCases={onOpenTestCases} notifications={mockNotifications}>
            <div className="dashboard-layout">
                <nav className="sidebar">
                    {Object.entries(menu).map(([key, {label, icon}]) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`sidebar-item ${activeTab === key ? 'active' : ''}`}>
                            {icon} <span>{label}</span>
                        </button>
                    ))}
                </nav>
                <main className="main-content alt-bg">{renderContent()}</main>
            </div>
            <Modal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                title="Lý do từ chối đơn nghỉ"
                footer={
                    <>
                        <button className="action-button" onClick={() => setIsRejectionModalOpen(false)}>Hủy</button>
                        <button className="action-button primary" onClick={confirmDenyRequest}>Xác nhận từ chối</button>
                    </>
                }
            >
                <div className="form-group">
                    <label htmlFor="rejection-reason">Nhập lý do từ chối:</label>
                    <textarea 
                        id="rejection-reason" 
                        rows={4} 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ví dụ: Lý do không chính đáng, trùng lịch thi..."
                    />
                </div>
            </Modal>
            <Modal
                isOpen={isLeaveRequestModalOpen}
                onClose={handleCloseLeaveRequestModal}
                title="Chi tiết Đơn xin nghỉ"
                footer={<>
                    {selectedLeaveRequest?.status === 'pending' && (
                        <>
                            <button className="action-button deny" onClick={() => { if(selectedLeaveRequest) { handleDenyRequest(selectedLeaveRequest.id); handleCloseLeaveRequestModal(); }}}>
                                <XCircleIcon /> Từ chối
                            </button>
                            <button className="action-button primary approve" onClick={() => { if(selectedLeaveRequest) { handleApproveRequest(selectedLeaveRequest.id); handleCloseLeaveRequestModal(); }}}>
                                <CheckCircleIcon /> Duyệt
                            </button>
                        </>
                    )}
                    <button className="action-button" onClick={handleCloseLeaveRequestModal}>
                       {selectedLeaveRequest?.status === 'pending' ? 'Để sau' : 'Đóng'}
                    </button>
                </>}
            >
                {selectedLeaveRequest && (
                    <div className="leave-request-details">
                        <div className="detail-item">
                            <span className="detail-label">Học sinh:</span>
                            <span className="detail-value">{selectedLeaveRequest.studentName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Phụ huynh:</span>
                            <span className="detail-value">{selectedLeaveRequest.parentName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Ngày nghỉ:</span>
                            <span className="detail-value">{formatDate(new Date(selectedLeaveRequest.leaveDate.replace(/-/g, '/')))}</span>
                        </div>
                         <div className="detail-item">
                            <span className="detail-label">Lý do:</span>
                            <span className="detail-value">{selectedLeaveRequest.reason}</span>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Thông báo"
                footer={<button className="action-button primary" onClick={() => setShowSuccessModal(false)}>Đóng</button>}
            >
                <p style={{textAlign: 'center'}}>{successMessage}</p>
            </Modal>
        </Dashboard>
    );
};

const PrincipalView = ({ onBack, onOpenWorkflow, onOpenTestCases, attendanceConfig, setAttendanceConfig }: { onBack: () => void; onOpenWorkflow: () => void; onOpenTestCases: () => void; attendanceConfig: AttendanceConfig; setAttendanceConfig: React.Dispatch<React.SetStateAction<AttendanceConfig>> }) => {
    const [activeTab, setActiveTab] = useState(attendanceConfig.isConfigured ? 'overview' : 'config');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequestsData);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isAddingCustomTime, setIsAddingCustomTime] = useState(false);
    const [newCustomTime, setNewCustomTime] = useState({ classId: '', subject: '', period: '', week: '', startTime: '' });

    React.useEffect(() => {
        if (!attendanceConfig.isConfigured && activeTab !== 'config') {
            setActiveTab('config');
        }
    }, [attendanceConfig.isConfigured, activeTab]);

    const handleTabChange = (tab: string) => {
        if (!attendanceConfig.isConfigured && tab !== 'config') {
            alert('Vui lòng hoàn tất khai báo cấu hình trước khi sử dụng các chức năng khác.');
            return;
        }
        setActiveTab(tab);
    };

    const [leaveFilterPeriod, setLeaveFilterPeriod] = useState<'day' | 'month' | 'year'>('month');
    const [leaveFilterValue, setLeaveFilterValue] = useState(() => new Date().toISOString().slice(0, 7));

    const [detailedStatsGradeFilter, setDetailedStatsGradeFilter] = useState('Tất cả');
    const [detailedStatsTimeFilter, setDetailedStatsTimeFilter] = useState('Tháng này');

    // Detail modal for stats
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState<any[]>([]);
    const [modalColumns, setModalColumns] = useState<{ key: string; label: string }[]>([]);

    // Rejection modal state
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [requestToReject, setRequestToReject] = useState<string | null>(null);
    
    const handleDenyRequest = (id: string) => {
        setRequestToReject(id);
        setIsRejectionModalOpen(true);
    };

    const confirmDenyRequest = () => {
        if (!rejectionReason.trim()) {
            alert('Vui lòng nhập lý do từ chối.');
            return;
        }
        const id = requestToReject;
        const request = leaveRequests.find(r => r.id === id);
        if (!request) return;
        setLeaveRequests(prev => prev.map(r => r.id === id ? { 
            ...r, 
            status: 'rejected', 
            rejectionReason: rejectionReason,
            processedBy: 'Ban Giám hiệu',
            processedAt: new Date().toLocaleString('vi-VN')
        } : r));
        setSuccessMessage(`Đã từ chối đơn của học sinh ${request.studentName}.`);
        setShowSuccessModal(true);
        setIsRejectionModalOpen(false);
        setRejectionReason('');
        setRequestToReject(null);
    };

    const handleViewClassDetail = (cls: ReportData) => {
        setModalTitle(`Chi tiết chuyên cần - ${cls.name}`);
        const className = cls.name.replace('Lớp ', '');
        const studentsInClass = mockStudentsData.filter(s => s.className === className);
        
        const studentAttendanceData = studentsInClass.map((s, idx) => {
            const absentP = Math.floor(Math.random() * 2);
            const absentNp = Math.floor(Math.random() * 2);
            const totalAbsent = absentP + absentNp;
            const absentStr = totalAbsent > 0 ? `${absentP} CP / ${absentNp} KP` : '';
            const late = Math.floor(Math.random() * 2);
            
            return {
                stt: idx + 1,
                name: s.name,
                month: (90 + Math.random() * 10).toFixed(1) + '%',
                semester: (92 + Math.random() * 8).toFixed(1) + '%',
                year: (94 + Math.random() * 6).toFixed(1) + '%',
                absent: absentStr,
                late: late > 0 ? late : '',
            };
        });

        setModalData(studentAttendanceData);
        setModalColumns([
            { key: 'stt', label: 'STT' },
            { key: 'name', label: 'Họ và tên' },
            { key: 'month', label: 'Tháng' },
            { key: 'semester', label: 'Học kỳ' },
            { key: 'year', label: 'Cả năm' },
            { key: 'absent', label: 'Vắng (CP/KP)' },
            { key: 'late', label: 'Đi trễ' },
        ]);
        setIsDetailModalOpen(true);
    };


    const menu = {
        'config': { label: 'Khai báo cấu hình', icon: <SettingsIcon /> },
        'overview': { label: 'Báo cáo tổng quan', icon: <BuildingIcon /> },
        'detailed-stats': { label: 'Thống kê chi tiết', icon: <BarChartIcon /> },
        'recognition-history': { label: 'Lịch sử nhận diện AI', icon: <FaceIdIcon /> },
        'leave-requests': { label: 'Tình hình đơn nghỉ', icon: <MailIcon /> },
        'leave-history': { label: 'Lịch sử duyệt đơn', icon: <HistoryIcon /> },
    };
    
    const mockClassDataForGrade10: ReportData[] = Array.from({ length: 8 }, (_, i) => {
        const classNum = i + 1;
        const total = 30;
        const absent = Math.floor(Math.random() * 3);
        const late = Math.floor(Math.random() * 2);
        const present = total - absent;
        const rate = (present / total) * 100;
        return { 
            id: `10A${classNum}`, 
            name: `Lớp 10A${classNum}`, 
            attendanceRate: parseFloat(rate.toFixed(1)), 
            totalStudents: total, 
            present, 
            absent, 
            late 
        };
    });
    const mockClassDataForGrade11: ReportData[] = [
        { id: '11A1', name: 'Lớp 11A1', attendanceRate: 99.5, totalStudents: 42, present: 42, absent: 0, late: 0 },
        { id: '11A2', name: 'Lớp 11A2', attendanceRate: 97.3, totalStudents: 40, present: 39, absent: 1, late: 2 },
    ];
    const mockClassDataForGrade12: ReportData[] = [
        { id: '12A1', name: 'Lớp 12A1', attendanceRate: 96.8, totalStudents: 38, present: 37, absent: 1, late: 1 },
        { id: '12A2', name: 'Lớp 12A2', attendanceRate: 98.2, totalStudents: 39, present: 38, absent: 1, late: 0 },
    ];

    const mockSchoolData: ReportData[] = [
        { id: '10', name: 'Khối 10', attendanceRate: 97.2, totalStudents: 240, present: 232, absent: 8, late: 12, classes: mockClassDataForGrade10 },
        { id: '11', name: 'Khối 11', attendanceRate: 98.1, totalStudents: 420, present: 412, absent: 8, late: 15, classes: mockClassDataForGrade11 },
        { id: '12', name: 'Khối 12', attendanceRate: 97.5, totalStudents: 400, present: 390, absent: 10, late: 12, classes: mockClassDataForGrade12 },
    ];
    const pendingRequests = mockLeaveRequestsData.filter(r => r.status === 'pending');
    
    const requestsByGrade: { [key: string]: LeaveRequest[] } = {
        'Khối 10': pendingRequests.slice(0, 2), // Mock grouping
        'Khối 11': [],
        'Khối 12': pendingRequests.slice(2),
    };

    const allSchoolClasses = getAllClasses(mockSchoolData);
    const filteredSchoolClasses = allSchoolClasses.filter(cls => {
        if (detailedStatsGradeFilter === 'Tất cả') return true;
        return cls.name.includes(detailedStatsGradeFilter);
    });
    const topClasses = [...allSchoolClasses].sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 5);
    const bottomClasses = [...allSchoolClasses].sort((a, b) => a.attendanceRate - b.attendanceRate).slice(0, 5);


    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="principal-overview-layout">
                        <SchoolWideReportView title="Báo cáo Chuyên cần Toàn trường" data={mockSchoolData} hideDrillDown={true} />
                        <div className="top-bottom-lists">
                            <div className="ranking-card top">
                                <h3>Top 5 Lớp chuyên cần cao nhất</h3>
                                <ol className="ranking-list">
                                    {topClasses.map((cls, index) => (
                                        <li key={cls.id} className="ranking-item">
                                            <span className="rank">{index + 1}</span>
                                            <span className="name">{cls.name}</span>
                                            <span className="percentage top">{cls.attendanceRate.toFixed(1)}%</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div className="ranking-card bottom">
                                <h3>Top 5 Lớp chuyên cần thấp nhất</h3>
                                 <ol className="ranking-list">
                                    {bottomClasses.map((cls, index) => (
                                        <li key={cls.id} className="ranking-item">
                                            <span className="rank">{index + 1}</span>
                                            <span className="name">{cls.name}</span>
                                            <span className="percentage bottom">{cls.attendanceRate.toFixed(1)}%</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                );
            case 'detailed-stats':
                return (
                    <div className="card">
                        <div className="card-header-with-filters">
                            <h3 className="content-title">Thống kê chi tiết chuyên cần</h3>
                            <div className="filter-controls">
                                <div className="filter-group">
                                    <label>Khối</label>
                                    <select className="filter-select" value={detailedStatsGradeFilter} onChange={e => setDetailedStatsGradeFilter(e.target.value)}>
                                        <option value="Tất cả">Tất cả</option>
                                        <option value="Khối 10">Khối 10</option>
                                        <option value="Khối 11">Khối 11</option>
                                        <option value="Khối 12">Khối 12</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Thời gian</label>
                                    <select className="filter-select" value={detailedStatsTimeFilter} onChange={e => setDetailedStatsTimeFilter(e.target.value)}>
                                        <option value="Tháng này">Tháng này</option>
                                        <option value="Học kỳ I">Học kỳ I</option>
                                        <option value="Học kỳ II">Học kỳ II</option>
                                        <option value="Cả năm">Cả năm</option>
                                    </select>
                                </div>
                                <button className="export-button">
                                    <DownloadIcon /> Xuất dữ liệu
                                </button>
                            </div>
                        </div>
                        <div className="table-wrapper-scroll">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Lớp</th>
                                        <th>GVCN</th>
                                        <th>Sĩ số</th>
                                        <th>Có mặt (TB)</th>
                                        <th>Vắng (Tổng)</th>
                                        <th>Muộn (Tổng)</th>
                                        <th>Tỉ lệ %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSchoolClasses.map((cls, index) => (
                                        <tr key={cls.id} onClick={() => handleViewClassDetail(cls)} className="drill-down">
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="drill-down-cell">
                                                    <span>{cls.name}</span>
                                                    <ChevronRightIcon />
                                                </div>
                                            </td>
                                            <td>GV. {cls.name.split('A')[1]}</td>
                                            <td>{cls.totalStudents}</td>
                                            <td>{(cls.attendanceRate * cls.totalStudents / 100).toFixed(1)}</td>
                                            <td>{cls.absent}</td>
                                            <td>{cls.late}</td>
                                            <td>
                                                <div className="progress-bar-cell">
                                                    <span>{cls.attendanceRate}%</span>
                                                    <div className="progress-bar-container">
                                                        <div className="progress-bar-fill" style={{ width: `${cls.attendanceRate}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'recognition-history':
                return <RecognitionHistoryView />;
            case 'leave-requests':
                return (
                    <div className="card">
                        <div className="card-header-with-filters">
                            <h3 className="content-title">Tình hình đơn nghỉ ({pendingRequests.length})</h3>
                            <div className="filter-controls">
                                <div className="filter-group">
                                    <label>Xem theo</label>
                                    <select value={leaveFilterPeriod} onChange={e => setLeaveFilterPeriod(e.target.value as any)} className="filter-select">
                                        <option value="day">Ngày</option>
                                        <option value="month">Tháng</option>
                                        <option value="year">Năm học</option>
                                    </select>
                                </div>
                                {leaveFilterPeriod === 'day' && <input type="date" value={leaveFilterValue} onChange={e => setLeaveFilterValue(e.target.value)} className="filter-input" />}
                                {leaveFilterPeriod === 'month' && <input type="month" value={leaveFilterValue} onChange={e => setLeaveFilterValue(e.target.value)} className="filter-input" />}
                                {leaveFilterPeriod === 'year' && (
                                    <select value={leaveFilterValue} onChange={e => setLeaveFilterValue(e.target.value)} className="filter-select">
                                        <option value="2024-2025">2024-2025</option>
                                        <option value="2025-2026">2025-2026</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        
                        <div className="table-wrapper-scroll">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Họ tên</th>
                                        <th>Lớp</th>
                                        <th>GVCN</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày nghỉ</th>
                                        <th>Lý do</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingRequests.length > 0 ? pendingRequests.map((req, index) => (
                                        <tr key={req.id}>
                                            <td>{index + 1}</td>
                                            <td>{req.studentName}</td>
                                            <td>{req.className || 'N/A'}</td>
                                            <td>{req.gvcn || 'N/A'}</td>
                                            <td>
                                                <span className={`status-badge status-${req.status}`}>
                                                    {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                                                </span>
                                            </td>
                                            <td>{formatDate(new Date(req.leaveDate.replace(/-/g, '/')))}</td>
                                            <td>{req.reason}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} style={{textAlign: 'center', padding: '20px'}}>Không có đơn nghỉ nào.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'config':
                return (
                    <div className="config-container">
                        {!attendanceConfig.isConfigured && (
                            <div className="info-message warning" style={{ marginBottom: '20px' }}>
                                <InfoIcon />
                                <span>Vui lòng hoàn tất khai báo cấu hình để sử dụng các chức năng khác.</span>
                            </div>
                        )}
                        
                        <div className="card" style={{ borderTop: '4px solid #3b82f6', marginBottom: '20px' }}>
                            <div className="card-header-with-filters">
                                <h3 className="content-title" style={{ color: '#1e3a8a' }}>1. Khai báo thời gian vào lớp</h3>
                            </div>
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', gap: '30px', marginBottom: '25px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Buổi sáng</label>
                                        <input type="time" className="filter-input" value={attendanceConfig.morningStartTime} onChange={(e) => setAttendanceConfig({ ...attendanceConfig, morningStartTime: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Buổi chiều</label>
                                        <input type="time" className="filter-input" value={attendanceConfig.afternoonStartTime} onChange={(e) => setAttendanceConfig({ ...attendanceConfig, afternoonStartTime: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }} />
                                    </div>
                                    <div style={{ flex: 2, minWidth: 0 }}></div> {/* Empty space to keep inputs from stretching too much */}
                                </div>
                                <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e40af' }}>Cấu hình giờ riêng</h4>
                                        {!isAddingCustomTime && (
                                            <button className="action-button primary" style={{ backgroundColor: '#2563eb' }} onClick={() => {
                                                setIsAddingCustomTime(true);
                                            }}>+ Thêm cấu hình</button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '15px' }}>Cho phép chọn lớp học/tiết/tuần học để điểm danh cho các tiết học không cố định.</p>
                                    
                                    {/* Danh sách các cấu hình đã lưu */}
                                    {attendanceConfig.customTimes.map((customTime) => (
                                        <div key={customTime.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600, color: '#1e3a8a' }}>Lớp {customTime.classId || '...'}</span>
                                                <span style={{ color: '#475569' }}>• Tiết {customTime.period || '...'}</span>
                                                <span style={{ color: '#475569' }}>• Tuần {customTime.week || '...'}</span>
                                                {customTime.subject && <span style={{ color: '#475569' }}>• Môn {customTime.subject}</span>}
                                                <span style={{ fontWeight: 600, color: '#2563eb' }}>• {customTime.startTime || '--:--'}</span>
                                            </div>
                                            <button className="action-button" style={{ color: '#ef4444', borderColor: '#ef4444', backgroundColor: '#fef2f2', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => {
                                                const newCustomTimes = attendanceConfig.customTimes.filter(ct => ct.id !== customTime.id);
                                                setAttendanceConfig({ ...attendanceConfig, customTimes: newCustomTimes });
                                            }}>Xóa</button>
                                        </div>
                                    ))}

                                    {/* Form thêm cấu hình mới */}
                                    {isAddingCustomTime && (
                                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '15px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lớp học</label>
                                                    <select className="filter-select" value={newCustomTime.classId} onChange={(e) => setNewCustomTime({ ...newCustomTime, classId: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }}>
                                                        <option value="">Chọn lớp</option>
                                                        <option value="10A1">10A1</option>
                                                        <option value="10A2">10A2</option>
                                                        <option value="11A1">11A1</option>
                                                    </select>
                                                </div>
                                                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tiết học</label>
                                                    <select className="filter-select" value={newCustomTime.period} onChange={(e) => setNewCustomTime({ ...newCustomTime, period: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }}>
                                                        <option value="">Chọn tiết</option>
                                                        <option value="1">Tiết 1</option>
                                                        <option value="2">Tiết 2</option>
                                                        <option value="3">Tiết 3</option>
                                                    </select>
                                                </div>
                                                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tuần học</label>
                                                    <select className="filter-select" value={newCustomTime.week} onChange={(e) => setNewCustomTime({ ...newCustomTime, week: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }}>
                                                        <option value="">Chọn tuần</option>
                                                        <option value="1">Tuần 1</option>
                                                        <option value="2">Tuần 2</option>
                                                        <option value="3">Tuần 3</option>
                                                    </select>
                                                </div>
                                                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tên môn</label>
                                                    <input type="text" className="filter-input" placeholder="Nhập tên môn" value={newCustomTime.subject} onChange={(e) => setNewCustomTime({ ...newCustomTime, subject: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }} />
                                                </div>
                                                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                                                    <label style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Giờ vào lớp</label>
                                                    <input type="time" className="filter-input" value={newCustomTime.startTime} onChange={(e) => setNewCustomTime({ ...newCustomTime, startTime: e.target.value })} style={{ width: '100%', borderColor: '#bfdbfe', minWidth: 0 }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button className="action-button" style={{ color: '#64748b', borderColor: '#cbd5e1', backgroundColor: '#f8fafc', whiteSpace: 'nowrap', minWidth: '80px' }} onClick={() => {
                                                    setIsAddingCustomTime(false);
                                                    setNewCustomTime({ classId: '', subject: '', period: '', week: '', startTime: '' });
                                                }}>Hủy</button>
                                                <button className="action-button primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981', minWidth: '80px' }} onClick={() => {
                                                    if (!newCustomTime.classId || !newCustomTime.period || !newCustomTime.week || !newCustomTime.startTime) {
                                                        alert('Vui lòng điền đầy đủ thông tin bắt buộc (Lớp, Tiết, Tuần, Giờ).');
                                                        return;
                                                    }
                                                    setAttendanceConfig({
                                                        ...attendanceConfig,
                                                        customTimes: [...attendanceConfig.customTimes, { id: Date.now().toString(), ...newCustomTime }]
                                                    });
                                                    setIsAddingCustomTime(false);
                                                    setNewCustomTime({ classId: '', subject: '', period: '', week: '', startTime: '' });
                                                    setSuccessMessage('Đã lưu cấu hình giờ riêng thành công.');
                                                    setShowSuccessModal(true);
                                                }}>Lưu</button>
                                            </div>
                                        </div>
                                    )}

                                    {attendanceConfig.customTimes.length === 0 && !isAddingCustomTime && <p style={{ fontSize: '0.9rem', color: '#60a5fa', fontStyle: 'italic' }}>Chưa có cấu hình giờ riêng nào.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #3b82f6', marginBottom: '20px' }}>
                            <div className="card-header-with-filters">
                                <h3 className="content-title" style={{ color: '#1e3a8a' }}>2. Chọn cách nhập chuyên cần</h3>
                            </div>
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', gap: '30px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '15px 20px', backgroundColor: attendanceConfig.entryMethod === 'day' ? '#eff6ff' : 'white', border: `1px solid ${attendanceConfig.entryMethod === 'day' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', flex: 1 }}>
                                        <input type="radio" name="entryMethod" value="day" checked={attendanceConfig.entryMethod === 'day'} onChange={() => setAttendanceConfig({ ...attendanceConfig, entryMethod: 'day' })} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                        <span style={{ color: attendanceConfig.entryMethod === 'day' ? '#1e40af' : '#475569', fontWeight: attendanceConfig.entryMethod === 'day' ? 600 : 400 }}>Tính chuyên cần theo ngày</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '15px 20px', backgroundColor: attendanceConfig.entryMethod === 'session' ? '#eff6ff' : 'white', border: `1px solid ${attendanceConfig.entryMethod === 'session' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', flex: 1 }}>
                                        <input type="radio" name="entryMethod" value="session" checked={attendanceConfig.entryMethod === 'session'} onChange={() => setAttendanceConfig({ ...attendanceConfig, entryMethod: 'session' })} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                        <span style={{ color: attendanceConfig.entryMethod === 'session' ? '#1e40af' : '#475569', fontWeight: attendanceConfig.entryMethod === 'session' ? 600 : 400 }}>Tính chuyên cần theo buổi</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid #3b82f6', marginBottom: '20px' }}>
                            <div className="card-header-with-filters">
                                <h3 className="content-title" style={{ color: '#1e3a8a' }}>3. Cách tính ngày nghỉ chuyên cần</h3>
                            </div>
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '15px 20px', backgroundColor: attendanceConfig.leaveCalculation === 'full-day' ? '#eff6ff' : 'white', border: `1px solid ${attendanceConfig.leaveCalculation === 'full-day' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                        <input type="radio" name="leaveCalculation" value="full-day" checked={attendanceConfig.leaveCalculation === 'full-day'} onChange={() => setAttendanceConfig({ ...attendanceConfig, leaveCalculation: 'full-day' })} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                        <span style={{ color: attendanceConfig.leaveCalculation === 'full-day' ? '#1e40af' : '#475569', fontWeight: attendanceConfig.leaveCalculation === 'full-day' ? 600 : 400 }}>Chỉ tính buổi nghỉ cả ngày</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '15px 20px', backgroundColor: attendanceConfig.leaveCalculation === 'aggregate' ? '#eff6ff' : 'white', border: `1px solid ${attendanceConfig.leaveCalculation === 'aggregate' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                        <input type="radio" name="leaveCalculation" value="aggregate" checked={attendanceConfig.leaveCalculation === 'aggregate'} onChange={() => setAttendanceConfig({ ...attendanceConfig, leaveCalculation: 'aggregate' })} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                        <span style={{ color: attendanceConfig.leaveCalculation === 'aggregate' ? '#1e40af' : '#475569', fontWeight: attendanceConfig.leaveCalculation === 'aggregate' ? 600 : 400 }}>Tính gộp các buổi nghỉ</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '15px 20px', backgroundColor: attendanceConfig.leaveCalculation === 'per-session' ? '#eff6ff' : 'white', border: `1px solid ${attendanceConfig.leaveCalculation === 'per-session' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                        <input type="radio" name="leaveCalculation" value="per-session" checked={attendanceConfig.leaveCalculation === 'per-session'} onChange={() => setAttendanceConfig({ ...attendanceConfig, leaveCalculation: 'per-session' })} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                        <span style={{ color: attendanceConfig.leaveCalculation === 'per-session' ? '#1e40af' : '#475569', fontWeight: attendanceConfig.leaveCalculation === 'per-session' ? 600 : 400 }}>Tính theo từng buổi nghỉ</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="action-button primary" style={{ backgroundColor: '#2563eb', padding: '12px 24px', fontSize: '1rem' }} onClick={() => {
                                setAttendanceConfig({ ...attendanceConfig, isConfigured: true });
                                setSuccessMessage('Đã lưu cấu hình thành công.');
                                setShowSuccessModal(true);
                            }}>Lưu cấu hình</button>
                        </div>
                    </div>
                );
            case 'leave-history':
                const processedRequests = leaveRequests.filter(r => r.status !== 'pending');
                return (
                    <div className="card">
                        <h3>Lịch sử duyệt đơn nghỉ ({processedRequests.length})</h3>
                        {processedRequests.length > 0 ? (
                            <div className="leave-history-list">
                                {processedRequests.map(req => (
                                    <div key={req.id} className={`leave-history-item ${req.status}`}>
                                        <div className="history-item-header">
                                            <div className="student-info">
                                                <strong>{req.studentName}</strong>
                                                <span className="class-tag">Lớp 10A1</span>
                                            </div>
                                            <span className={`status-badge status-${req.status}`}>
                                                {req.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                                            </span>
                                        </div>
                                        <div className="history-item-details">
                                            <p><strong>Ngày nghỉ:</strong> {formatDate(new Date(req.leaveDate.replace(/-/g, '/')))}</p>
                                            <p><strong>Lý do nghỉ:</strong> {req.reason}</p>
                                            {req.status === 'rejected' && (
                                                <p className="rejection-note"><strong>Lý do từ chối:</strong> {req.rejectionReason}</p>
                                            )}
                                            <div className="process-info">
                                                <span>Người duyệt: {req.processedBy || 'Hệ thống'}</span>
                                                <span>Thời gian: {req.processedAt || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data-message">Chưa có lịch sử duyệt đơn.</p>
                        )}
                    </div>
                );
            default: return null;
        }
    }
    
    return (
        <Dashboard role="Ban Giám hiệu" onBack={onBack} onOpenWorkflow={onOpenWorkflow} onOpenTestCases={onOpenTestCases} notifications={mockNotifications}>
            <div className="dashboard-layout">
                <nav className="sidebar">
                    {Object.entries(menu).map(([key, {label, icon}]) => (
                        <button key={key} onClick={() => handleTabChange(key)} className={`sidebar-item ${activeTab === key ? 'active' : ''}`}>
                            {icon} <span>{label}</span>
                        </button>
                    ))}
                </nav>
                <main className={`main-content ${activeTab === 'overview' || activeTab === 'recognition-history' ? 'alt-bg' : ''}`}>{renderContent()}</main>
            </div>
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={modalTitle}
                className="report-detail-modal"
                footer={<button className="action-button primary" onClick={() => setIsDetailModalOpen(false)}>Đóng</button>}
            >
                <div className="table-wrapper-scroll">
                    <table className="report-table detail-table">
                        <thead>
                            <tr>
                                {modalColumns.map(col => <th key={col.key}>{col.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {modalData.length > 0 ? modalData.map((item, index) => (
                                <tr key={index}>
                                    {modalColumns.map(col => (
                                        <td key={col.key}>
                                            {item[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={modalColumns.length} style={{ textAlign: 'center', padding: '20px' }}>
                                        Không có dữ liệu.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
             <Modal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                title="Lý do từ chối đơn nghỉ"
                footer={
                    <>
                        <button className="action-button" onClick={() => setIsRejectionModalOpen(false)}>Hủy</button>
                        <button className="action-button primary" onClick={confirmDenyRequest}>Xác nhận từ chối</button>
                    </>
                }
            >
                <div className="form-group">
                    <label htmlFor="rejection-reason">Nhập lý do từ chối:</label>
                    <textarea 
                        id="rejection-reason" 
                        rows={4} 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ví dụ: Lý do không chính đáng, trùng lịch thi..."
                    />
                </div>
            </Modal>
             <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Thông báo"
                footer={
                    <button 
                        className="action-button primary" 
                        onClick={() => setShowSuccessModal(false)}
                    >
                        Đóng
                    </button>
                }
            >
                <p style={{textAlign: 'center'}}>{successMessage}</p>
            </Modal>
        </Dashboard>
    );
};


// --- MAIN APP ---

function App() {
  const [view, setView] = useState<View>('landing');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceConfig>({
      morningStartTime: '07:30',
      afternoonStartTime: '13:30',
      customTimes: [],
      entryMethod: 'session',
      leaveCalculation: 'per-session',
      isConfigured: false,
  });

  const handleRoleSelect = (role: Role) => {
    setView(role);
  };

  const handleBackToRoleSelection = () => {
    setView('role-selection');
  }

  const openTestCases = () => setIsTestCaseModalOpen(true);

  const renderContent = () => {
    switch (view) {
      case 'teacher':
        return <TeacherView onBack={handleBackToRoleSelection} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} onOpenTestCases={openTestCases} attendanceConfig={attendanceConfig} />;
      case 'parent':
        return <ParentView onBack={handleBackToRoleSelection} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} onOpenTestCases={openTestCases} attendanceConfig={attendanceConfig} />;
      case 'student':
        return <StudentView onBack={handleBackToRoleSelection} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} onOpenTestCases={openTestCases} attendanceConfig={attendanceConfig} />;
      case 'head_teacher':
        return <HeadTeacherView onBack={handleBackToRoleSelection} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} onOpenTestCases={openTestCases} />;
      case 'principal':
        return <PrincipalView onBack={handleBackToRoleSelection} onOpenWorkflow={() => setIsWorkflowModalOpen(true)} onOpenTestCases={openTestCases} attendanceConfig={attendanceConfig} setAttendanceConfig={setAttendanceConfig} />;
      case 'role-selection':
        return (
          <div className="role-selection-container">
            <h1 className="dramatic-title">Chọn vai trò của bạn</h1>
            <div className="role-cards-grid">
                <div className="role-card" onClick={() => handleRoleSelect('teacher')}>
                    <BriefcaseIcon />
                    <h2>Giáo viên</h2>
                    <p>Quản lý điểm danh, đăng ký khuôn mặt, xem báo cáo.</p>
                </div>
                <div className="role-card" onClick={() => handleRoleSelect('parent')}>
                    <UsersIcon />
                    <h2>Phụ huynh</h2>
                    <p>Theo dõi lịch sử điểm danh, gửi đơn xin nghỉ phép.</p>
                </div>
                <div className="role-card" onClick={() => handleRoleSelect('student')}>
                    <UserIcon />
                    <h2>Học sinh</h2>
                    <p>Xem trạng thái điểm danh và lịch sử cá nhân.</p>
                </div>
                <div className="role-card" onClick={() => handleRoleSelect('head_teacher')}>
                    <UsersGroupIcon />
                    <h2>Tổ trưởng</h2>
                    <p>Tổng quan các lớp phụ trách, duyệt đơn nghỉ cấp tổ.</p>
                </div>
                 <div className="role-card" onClick={() => handleRoleSelect('principal')}>
                    <BuildingIcon />
                    <h2>Ban Giám hiệu</h2>
                    <p>Báo cáo toàn trường, theo dõi tình hình chuyên cần.</p>
                </div>
            </div>
          </div>
        );
      case 'landing':
      default:
        return (
            <div className="landing-container">
                <h1 className="dramatic-title">Module Điểm Danh</h1>
                <p className="subtitle">Hệ thống điểm danh thông minh</p>
                <button className="primary-button" onClick={() => setView('role-selection')}>
                    Truy cập
                    <ChevronRightIcon />
                </button>
            </div>
        );
    }
  };

  return (
    <>
      <div className="immersive-app">
        <DottedGlowBackground 
          gap={24} 
          radius={1.5} 
          color="rgba(0, 0, 0, 0.04)" 
          glowColor="rgba(60, 120, 255, 0.1)" 
          speedScale={0.5} 
        />
        <div className="content-area">
            {renderContent()}
        </div>
      </div>
      <Modal
            isOpen={isWorkflowModalOpen}
            onClose={() => setIsWorkflowModalOpen(false)}
            title="Quy trình điểm danh"
            className="workflow-modal"
            footer={
                <button
                    className="action-button primary"
                    onClick={() => setIsWorkflowModalOpen(false)}
                >
                    Đã hiểu
                </button>
            }
        >
            <WorkflowModalContent />
        </Modal>
        <Modal
            isOpen={isTestCaseModalOpen}
            onClose={() => setIsTestCaseModalOpen(false)}
            title="Kịch bản Test Case"
            className="test-case-modal"
            footer={
                <button
                    className="action-button primary"
                    onClick={() => setIsTestCaseModalOpen(false)}
                >
                    Đóng
                </button>
            }
        >
            <TestCaseModalContent />
        </Modal>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
