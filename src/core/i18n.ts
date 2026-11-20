/**
 * UI strings. Every visible text of the viewer comes from here, including
 * error and "unsupported file" messages (GitHub issue #9).
 *
 * Placeholders use `{name}` syntax.
 */
export interface Messages {
  open: string;
  download: string;
  print: string;
  fullscreen: string;
  exitFullscreen: string;
  zoomIn: string;
  zoomOut: string;
  zoomFit: string;
  zoomWidth: string;
  zoomPage: string;
  actualSize: string;
  rotateLeft: string;
  rotateRight: string;
  flipHorizontal: string;
  flipVertical: string;
  reset: string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  page: string;
  pageOf: string;
  search: string;
  searchPlaceholder: string;
  findNext: string;
  findPrevious: string;
  matchCase: string;
  noMatches: string;
  matchesCount: string;
  closeSearch: string;
  loading: string;
  loadingFile: string;
  dropHere: string;
  emptyTitle: string;
  emptyHint: string;
  unsupportedTitle: string;
  unsupported: string;
  unsupportedLegacy: string;
  formatDisabled: string;
  fileTooLarge: string;
  errorTitle: string;
  invalidUrl: string;
  libraryError: string;
  passwordRequired: string;
  passwordIncorrect: string;
  password: string;
  submit: string;
  cancel: string;
  darkMode: string;
  lightMode: string;
  sidebar: string;
  thumbnails: string;
  outline: string;
  noOutline: string;
  presentation: string;
  slideshow: string;
  slideList: string;
  play: string;
  pause: string;
  slide: string;
  sheet: string;
  rowsTruncated: string;
  wrapLines: string;
  lineNumbers: string;
  transparencyGrid: string;
  handTool: string;
  selectTool: string;
  words: string;
  dimensions: string;
  more: string;
}

export const en: Messages = {
  open: "Open file",
  download: "Download",
  print: "Print",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  zoomFit: "Fit",
  zoomWidth: "Fit width",
  zoomPage: "Fit page",
  actualSize: "Actual size",
  rotateLeft: "Rotate left",
  rotateRight: "Rotate right",
  flipHorizontal: "Flip horizontally",
  flipVertical: "Flip vertically",
  reset: "Reset",
  firstPage: "First page",
  previousPage: "Previous",
  nextPage: "Next",
  lastPage: "Last page",
  page: "Page",
  pageOf: "of {total}",
  search: "Search",
  searchPlaceholder: "Find in document…",
  findNext: "Next match",
  findPrevious: "Previous match",
  matchCase: "Match case",
  noMatches: "No matches",
  matchesCount: "{current} of {total}",
  closeSearch: "Close search",
  loading: "Loading…",
  loadingFile: "Loading {name}…",
  dropHere: "Drop a file to open it",
  emptyTitle: "No document open",
  emptyHint: "Open a file or drag and drop it here",
  unsupportedTitle: "Can't preview this file",
  unsupported: "The file type \"{ext}\" is not supported.",
  unsupportedLegacy: "Legacy .{ext} files are not supported. Save the file as .{suggest} and open it again.",
  formatDisabled: "Viewing {kind} files is disabled.",
  fileTooLarge: "The file is too large to open.",
  errorTitle: "Couldn't open the file",
  invalidUrl: "The file address is not allowed.",
  libraryError: "A required component could not be loaded. Check your network connection.",
  passwordRequired: "This document is password protected.",
  passwordIncorrect: "Incorrect password. Try again.",
  password: "Password",
  submit: "Open",
  cancel: "Cancel",
  darkMode: "Dark mode",
  lightMode: "Light mode",
  sidebar: "Toggle sidebar",
  thumbnails: "Thumbnails",
  outline: "Outline",
  noOutline: "This document has no outline.",
  presentation: "Presentation mode",
  slideshow: "Slideshow",
  slideList: "All slides",
  play: "Play",
  pause: "Pause",
  slide: "Slide",
  sheet: "Sheet",
  rowsTruncated: "Showing the first {count} rows.",
  wrapLines: "Wrap lines",
  lineNumbers: "Line numbers",
  transparencyGrid: "Transparency grid",
  handTool: "Hand tool",
  selectTool: "Text selection tool",
  words: "{count} words",
  dimensions: "{width} × {height} px",
  more: "More",
};

const he: Partial<Messages> = {
  open: "פתיחת קובץ",
  download: "הורדה",
  print: "הדפסה",
  fullscreen: "מסך מלא",
  exitFullscreen: "יציאה ממסך מלא",
  zoomIn: "הגדלה",
  zoomOut: "הקטנה",
  zoomFit: "התאמה",
  zoomWidth: "התאמה לרוחב",
  zoomPage: "התאמה לעמוד",
  actualSize: "גודל אמיתי",
  rotateLeft: "סיבוב שמאלה",
  rotateRight: "סיבוב ימינה",
  flipHorizontal: "היפוך אופקי",
  flipVertical: "היפוך אנכי",
  reset: "איפוס",
  firstPage: "עמוד ראשון",
  previousPage: "הקודם",
  nextPage: "הבא",
  lastPage: "עמוד אחרון",
  page: "עמוד",
  pageOf: "מתוך {total}",
  search: "חיפוש",
  searchPlaceholder: "חיפוש במסמך…",
  findNext: "התוצאה הבאה",
  findPrevious: "התוצאה הקודמת",
  matchCase: "התאמת רישיות",
  noMatches: "אין תוצאות",
  matchesCount: "{current} מתוך {total}",
  closeSearch: "סגירת החיפוש",
  loading: "טוען…",
  loadingFile: "טוען את {name}…",
  dropHere: "שחררו קובץ כדי לפתוח אותו",
  emptyTitle: "אין מסמך פתוח",
  emptyHint: "פתחו קובץ או גררו אותו לכאן",
  unsupportedTitle: "לא ניתן להציג את הקובץ",
  unsupported: "סוג הקובץ \"{ext}\" אינו נתמך.",
  unsupportedLegacy: "קבצי ‎.{ext} ישנים אינם נתמכים. שמרו את הקובץ בפורמט ‎.{suggest} ופתחו אותו שוב.",
  formatDisabled: "הצגת קבצי {kind} מושבתת.",
  fileTooLarge: "הקובץ גדול מדי לפתיחה.",
  errorTitle: "לא ניתן לפתוח את הקובץ",
  invalidUrl: "כתובת הקובץ אינה מורשית.",
  libraryError: "לא ניתן היה לטעון רכיב נדרש. בדקו את חיבור הרשת.",
  passwordRequired: "המסמך מוגן בסיסמה.",
  passwordIncorrect: "סיסמה שגויה. נסו שוב.",
  password: "סיסמה",
  submit: "פתיחה",
  cancel: "ביטול",
  darkMode: "מצב כהה",
  lightMode: "מצב בהיר",
  sidebar: "הצגה/הסתרה של סרגל הצד",
  thumbnails: "תמונות ממוזערות",
  outline: "תוכן עניינים",
  noOutline: "למסמך זה אין תוכן עניינים.",
  presentation: "מצב מצגת",
  slideshow: "מצגת",
  slideList: "כל השקופיות",
  play: "הפעלה",
  pause: "השהיה",
  slide: "שקופית",
  sheet: "גיליון",
  rowsTruncated: "מוצגות {count} השורות הראשונות.",
  wrapLines: "גלישת שורות",
  lineNumbers: "מספרי שורות",
  transparencyGrid: "רשת שקיפות",
  handTool: "כלי יד",
  selectTool: "כלי בחירת טקסט",
  words: "{count} מילים",
  more: "עוד",
};

const ar: Partial<Messages> = {
  open: "فتح ملف",
  download: "تنزيل",
  print: "طباعة",
  fullscreen: "ملء الشاشة",
  exitFullscreen: "الخروج من ملء الشاشة",
  zoomIn: "تكبير",
  zoomOut: "تصغير",
  zoomFit: "ملاءمة",
  zoomWidth: "ملاءمة العرض",
  zoomPage: "ملاءمة الصفحة",
  actualSize: "الحجم الفعلي",
  rotateLeft: "تدوير لليسار",
  rotateRight: "تدوير لليمين",
  flipHorizontal: "قلب أفقي",
  flipVertical: "قلب عمودي",
  reset: "إعادة تعيين",
  firstPage: "الصفحة الأولى",
  previousPage: "السابق",
  nextPage: "التالي",
  lastPage: "الصفحة الأخيرة",
  page: "صفحة",
  pageOf: "من {total}",
  search: "بحث",
  searchPlaceholder: "البحث في المستند…",
  findNext: "النتيجة التالية",
  findPrevious: "النتيجة السابقة",
  matchCase: "مطابقة حالة الأحرف",
  noMatches: "لا توجد نتائج",
  matchesCount: "{current} من {total}",
  closeSearch: "إغلاق البحث",
  loading: "جارٍ التحميل…",
  loadingFile: "جارٍ تحميل {name}…",
  dropHere: "أفلت ملفًا لفتحه",
  emptyTitle: "لا يوجد مستند مفتوح",
  emptyHint: "افتح ملفًا أو اسحبه وأفلته هنا",
  unsupportedTitle: "تعذّرت معاينة هذا الملف",
  unsupported: "نوع الملف \"{ext}\" غير مدعوم.",
  unsupportedLegacy: "ملفات ‎.{ext} القديمة غير مدعومة. احفظ الملف بصيغة ‎.{suggest} ثم افتحه مجددًا.",
  formatDisabled: "عرض ملفات {kind} معطّل.",
  fileTooLarge: "الملف كبير جدًا لفتحه.",
  errorTitle: "تعذّر فتح الملف",
  invalidUrl: "عنوان الملف غير مسموح به.",
  libraryError: "تعذّر تحميل مكوّن مطلوب. تحقّق من اتصال الشبكة.",
  passwordRequired: "هذا المستند محمي بكلمة مرور.",
  passwordIncorrect: "كلمة المرور غير صحيحة. حاول مرة أخرى.",
  password: "كلمة المرور",
  submit: "فتح",
  cancel: "إلغاء",
  darkMode: "الوضع الداكن",
  lightMode: "الوضع الفاتح",
  sidebar: "إظهار/إخفاء الشريط الجانبي",
  thumbnails: "الصور المصغّرة",
  outline: "المخطط",
  noOutline: "لا يحتوي هذا المستند على مخطط.",
  presentation: "وضع العرض التقديمي",
  slideshow: "عرض الشرائح",
  slideList: "كل الشرائح",
  play: "تشغيل",
  pause: "إيقاف مؤقت",
  slide: "شريحة",
  sheet: "ورقة",
  rowsTruncated: "يتم عرض أول {count} صف.",
  wrapLines: "التفاف الأسطر",
  lineNumbers: "أرقام الأسطر",
  transparencyGrid: "شبكة الشفافية",
  handTool: "أداة اليد",
  selectTool: "أداة تحديد النص",
  words: "{count} كلمة",
  more: "المزيد",
};

const es: Partial<Messages> = {
  open: "Abrir archivo",
  download: "Descargar",
  print: "Imprimir",
  fullscreen: "Pantalla completa",
  exitFullscreen: "Salir de pantalla completa",
  zoomIn: "Acercar",
  zoomOut: "Alejar",
  zoomFit: "Ajustar",
  zoomWidth: "Ajustar al ancho",
  zoomPage: "Ajustar a la página",
  actualSize: "Tamaño real",
  rotateLeft: "Girar a la izquierda",
  rotateRight: "Girar a la derecha",
  flipHorizontal: "Voltear horizontalmente",
  flipVertical: "Voltear verticalmente",
  reset: "Restablecer",
  firstPage: "Primera página",
  previousPage: "Anterior",
  nextPage: "Siguiente",
  lastPage: "Última página",
  page: "Página",
  pageOf: "de {total}",
  search: "Buscar",
  searchPlaceholder: "Buscar en el documento…",
  findNext: "Siguiente coincidencia",
  findPrevious: "Coincidencia anterior",
  matchCase: "Coincidir mayúsculas y minúsculas",
  noMatches: "Sin coincidencias",
  matchesCount: "{current} de {total}",
  closeSearch: "Cerrar búsqueda",
  loading: "Cargando…",
  loadingFile: "Cargando {name}…",
  dropHere: "Suelta un archivo para abrirlo",
  emptyTitle: "Ningún documento abierto",
  emptyHint: "Abre un archivo o arrástralo aquí",
  unsupportedTitle: "No se puede mostrar este archivo",
  unsupported: "El tipo de archivo \"{ext}\" no es compatible.",
  unsupportedLegacy: "Los archivos .{ext} antiguos no son compatibles. Guarda el archivo como .{suggest} y ábrelo de nuevo.",
  formatDisabled: "La visualización de archivos {kind} está desactivada.",
  fileTooLarge: "El archivo es demasiado grande para abrirlo.",
  errorTitle: "No se pudo abrir el archivo",
  invalidUrl: "La dirección del archivo no está permitida.",
  libraryError: "No se pudo cargar un componente necesario. Comprueba tu conexión.",
  passwordRequired: "Este documento está protegido con contraseña.",
  passwordIncorrect: "Contraseña incorrecta. Inténtalo de nuevo.",
  password: "Contraseña",
  submit: "Abrir",
  cancel: "Cancelar",
  darkMode: "Modo oscuro",
  lightMode: "Modo claro",
  sidebar: "Mostrar u ocultar la barra lateral",
  thumbnails: "Miniaturas",
  outline: "Esquema",
  noOutline: "Este documento no tiene esquema.",
  presentation: "Modo presentación",
  slideshow: "Presentación",
  slideList: "Todas las diapositivas",
  play: "Reproducir",
  pause: "Pausa",
  slide: "Diapositiva",
  sheet: "Hoja",
  rowsTruncated: "Se muestran las primeras {count} filas.",
  wrapLines: "Ajustar líneas",
  lineNumbers: "Números de línea",
  transparencyGrid: "Cuadrícula de transparencia",
  handTool: "Herramienta mano",
  selectTool: "Herramienta de selección de texto",
  words: "{count} palabras",
  more: "Más",
};

const fr: Partial<Messages> = {
  open: "Ouvrir un fichier",
  download: "Télécharger",
  print: "Imprimer",
  fullscreen: "Plein écran",
  exitFullscreen: "Quitter le plein écran",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  zoomFit: "Ajuster",
  zoomWidth: "Pleine largeur",
  zoomPage: "Page entière",
  actualSize: "Taille réelle",
  rotateLeft: "Rotation à gauche",
  rotateRight: "Rotation à droite",
  flipHorizontal: "Retourner horizontalement",
  flipVertical: "Retourner verticalement",
  reset: "Réinitialiser",
  firstPage: "Première page",
  previousPage: "Précédent",
  nextPage: "Suivant",
  lastPage: "Dernière page",
  page: "Page",
  pageOf: "sur {total}",
  search: "Rechercher",
  searchPlaceholder: "Rechercher dans le document…",
  findNext: "Occurrence suivante",
  findPrevious: "Occurrence précédente",
  matchCase: "Respecter la casse",
  noMatches: "Aucun résultat",
  matchesCount: "{current} sur {total}",
  closeSearch: "Fermer la recherche",
  loading: "Chargement…",
  loadingFile: "Chargement de {name}…",
  dropHere: "Déposez un fichier pour l'ouvrir",
  emptyTitle: "Aucun document ouvert",
  emptyHint: "Ouvrez un fichier ou glissez-le ici",
  unsupportedTitle: "Impossible d'afficher ce fichier",
  unsupported: "Le type de fichier « {ext} » n'est pas pris en charge.",
  unsupportedLegacy: "Les anciens fichiers .{ext} ne sont pas pris en charge. Enregistrez le fichier au format .{suggest} puis rouvrez-le.",
  formatDisabled: "L'affichage des fichiers {kind} est désactivé.",
  fileTooLarge: "Le fichier est trop volumineux pour être ouvert.",
  errorTitle: "Impossible d'ouvrir le fichier",
  invalidUrl: "L'adresse du fichier n'est pas autorisée.",
  libraryError: "Un composant nécessaire n'a pas pu être chargé. Vérifiez votre connexion.",
  passwordRequired: "Ce document est protégé par un mot de passe.",
  passwordIncorrect: "Mot de passe incorrect. Réessayez.",
  password: "Mot de passe",
  submit: "Ouvrir",
  cancel: "Annuler",
  darkMode: "Mode sombre",
  lightMode: "Mode clair",
  sidebar: "Afficher/masquer le panneau latéral",
  thumbnails: "Miniatures",
  outline: "Plan",
  noOutline: "Ce document n'a pas de plan.",
  presentation: "Mode présentation",
  slideshow: "Diaporama",
  slideList: "Toutes les diapositives",
  play: "Lecture",
  pause: "Pause",
  slide: "Diapositive",
  sheet: "Feuille",
  rowsTruncated: "Affichage des {count} premières lignes.",
  wrapLines: "Retour à la ligne",
  lineNumbers: "Numéros de ligne",
  transparencyGrid: "Grille de transparence",
  handTool: "Outil main",
  selectTool: "Outil de sélection de texte",
  words: "{count} mots",
  more: "Plus",
};

const de: Partial<Messages> = {
  open: "Datei öffnen",
  download: "Herunterladen",
  print: "Drucken",
  fullscreen: "Vollbild",
  exitFullscreen: "Vollbild beenden",
  zoomIn: "Vergrößern",
  zoomOut: "Verkleinern",
  zoomFit: "Einpassen",
  zoomWidth: "Seitenbreite",
  zoomPage: "Ganze Seite",
  actualSize: "Originalgröße",
  rotateLeft: "Nach links drehen",
  rotateRight: "Nach rechts drehen",
  flipHorizontal: "Horizontal spiegeln",
  flipVertical: "Vertikal spiegeln",
  reset: "Zurücksetzen",
  firstPage: "Erste Seite",
  previousPage: "Zurück",
  nextPage: "Weiter",
  lastPage: "Letzte Seite",
  page: "Seite",
  pageOf: "von {total}",
  search: "Suchen",
  searchPlaceholder: "Im Dokument suchen…",
  findNext: "Nächster Treffer",
  findPrevious: "Vorheriger Treffer",
  matchCase: "Groß-/Kleinschreibung beachten",
  noMatches: "Keine Treffer",
  matchesCount: "{current} von {total}",
  closeSearch: "Suche schließen",
  loading: "Wird geladen…",
  loadingFile: "{name} wird geladen…",
  dropHere: "Datei hier ablegen, um sie zu öffnen",
  emptyTitle: "Kein Dokument geöffnet",
  emptyHint: "Öffnen Sie eine Datei oder ziehen Sie sie hierher",
  unsupportedTitle: "Vorschau nicht möglich",
  unsupported: "Der Dateityp „{ext}“ wird nicht unterstützt.",
  unsupportedLegacy: "Alte .{ext}-Dateien werden nicht unterstützt. Speichern Sie die Datei als .{suggest} und öffnen Sie sie erneut.",
  formatDisabled: "Die Anzeige von {kind}-Dateien ist deaktiviert.",
  fileTooLarge: "Die Datei ist zu groß zum Öffnen.",
  errorTitle: "Die Datei konnte nicht geöffnet werden",
  invalidUrl: "Die Dateiadresse ist nicht erlaubt.",
  libraryError: "Eine benötigte Komponente konnte nicht geladen werden. Prüfen Sie Ihre Netzwerkverbindung.",
  passwordRequired: "Dieses Dokument ist kennwortgeschützt.",
  passwordIncorrect: "Falsches Kennwort. Bitte erneut versuchen.",
  password: "Kennwort",
  submit: "Öffnen",
  cancel: "Abbrechen",
  darkMode: "Dunkler Modus",
  lightMode: "Heller Modus",
  sidebar: "Seitenleiste ein-/ausblenden",
  thumbnails: "Miniaturansichten",
  outline: "Gliederung",
  noOutline: "Dieses Dokument hat keine Gliederung.",
  presentation: "Präsentationsmodus",
  slideshow: "Bildschirmpräsentation",
  slideList: "Alle Folien",
  play: "Abspielen",
  pause: "Pause",
  slide: "Folie",
  sheet: "Tabelle",
  rowsTruncated: "Die ersten {count} Zeilen werden angezeigt.",
  wrapLines: "Zeilen umbrechen",
  lineNumbers: "Zeilennummern",
  transparencyGrid: "Transparenzraster",
  handTool: "Hand-Werkzeug",
  selectTool: "Textauswahl-Werkzeug",
  words: "{count} Wörter",
  more: "Mehr",
};

const ru: Partial<Messages> = {
  open: "Открыть файл",
  download: "Скачать",
  print: "Печать",
  fullscreen: "Во весь экран",
  exitFullscreen: "Выйти из полноэкранного режима",
  zoomIn: "Увеличить",
  zoomOut: "Уменьшить",
  zoomFit: "По размеру",
  zoomWidth: "По ширине",
  zoomPage: "Страница целиком",
  actualSize: "Реальный размер",
  rotateLeft: "Повернуть влево",
  rotateRight: "Повернуть вправо",
  flipHorizontal: "Отразить по горизонтали",
  flipVertical: "Отразить по вертикали",
  reset: "Сбросить",
  firstPage: "Первая страница",
  previousPage: "Назад",
  nextPage: "Далее",
  lastPage: "Последняя страница",
  page: "Страница",
  pageOf: "из {total}",
  search: "Поиск",
  searchPlaceholder: "Найти в документе…",
  findNext: "Следующее совпадение",
  findPrevious: "Предыдущее совпадение",
  matchCase: "С учётом регистра",
  noMatches: "Совпадений нет",
  matchesCount: "{current} из {total}",
  closeSearch: "Закрыть поиск",
  loading: "Загрузка…",
  loadingFile: "Загрузка {name}…",
  dropHere: "Перетащите файл сюда, чтобы открыть",
  emptyTitle: "Документ не открыт",
  emptyHint: "Откройте файл или перетащите его сюда",
  unsupportedTitle: "Невозможно показать файл",
  unsupported: "Тип файла «{ext}» не поддерживается.",
  unsupportedLegacy: "Старые файлы .{ext} не поддерживаются. Сохраните файл в формате .{suggest} и откройте снова.",
  formatDisabled: "Просмотр файлов {kind} отключён.",
  fileTooLarge: "Файл слишком большой.",
  errorTitle: "Не удалось открыть файл",
  invalidUrl: "Адрес файла не разрешён.",
  libraryError: "Не удалось загрузить необходимый компонент. Проверьте подключение к сети.",
  passwordRequired: "Документ защищён паролем.",
  passwordIncorrect: "Неверный пароль. Попробуйте ещё раз.",
  password: "Пароль",
  submit: "Открыть",
  cancel: "Отмена",
  darkMode: "Тёмная тема",
  lightMode: "Светлая тема",
  sidebar: "Показать/скрыть боковую панель",
  thumbnails: "Миниатюры",
  outline: "Оглавление",
  noOutline: "В документе нет оглавления.",
  presentation: "Режим презентации",
  slideshow: "Слайд-шоу",
  slideList: "Все слайды",
  play: "Воспроизвести",
  pause: "Пауза",
  slide: "Слайд",
  sheet: "Лист",
  rowsTruncated: "Показаны первые {count} строк.",
  wrapLines: "Перенос строк",
  lineNumbers: "Номера строк",
  transparencyGrid: "Сетка прозрачности",
  handTool: "Рука",
  selectTool: "Выделение текста",
  words: "Слов: {count}",
  more: "Ещё",
};

const zh: Partial<Messages> = {
  open: "打开文件",
  download: "下载",
  print: "打印",
  fullscreen: "全屏",
  exitFullscreen: "退出全屏",
  zoomIn: "放大",
  zoomOut: "缩小",
  zoomFit: "适合",
  zoomWidth: "适合宽度",
  zoomPage: "适合页面",
  actualSize: "实际大小",
  rotateLeft: "向左旋转",
  rotateRight: "向右旋转",
  flipHorizontal: "水平翻转",
  flipVertical: "垂直翻转",
  reset: "重置",
  firstPage: "第一页",
  previousPage: "上一页",
  nextPage: "下一页",
  lastPage: "最后一页",
  page: "页",
  pageOf: "共 {total} 页",
  search: "查找",
  searchPlaceholder: "在文档中查找…",
  findNext: "下一个匹配",
  findPrevious: "上一个匹配",
  matchCase: "区分大小写",
  noMatches: "无匹配结果",
  matchesCount: "第 {current} 个，共 {total} 个",
  closeSearch: "关闭查找",
  loading: "正在加载…",
  loadingFile: "正在加载 {name}…",
  dropHere: "拖放文件以打开",
  emptyTitle: "未打开文档",
  emptyHint: "打开文件或将文件拖放到此处",
  unsupportedTitle: "无法预览此文件",
  unsupported: "不支持文件类型“{ext}”。",
  unsupportedLegacy: "不支持旧版 .{ext} 文件。请将文件另存为 .{suggest} 后重新打开。",
  formatDisabled: "已禁用 {kind} 文件的查看。",
  fileTooLarge: "文件太大，无法打开。",
  errorTitle: "无法打开文件",
  invalidUrl: "不允许使用该文件地址。",
  libraryError: "无法加载所需组件。请检查网络连接。",
  passwordRequired: "此文档受密码保护。",
  passwordIncorrect: "密码错误，请重试。",
  password: "密码",
  submit: "打开",
  cancel: "取消",
  darkMode: "深色模式",
  lightMode: "浅色模式",
  sidebar: "切换侧边栏",
  thumbnails: "缩略图",
  outline: "大纲",
  noOutline: "此文档没有大纲。",
  presentation: "演示模式",
  slideshow: "幻灯片放映",
  slideList: "所有幻灯片",
  play: "播放",
  pause: "暂停",
  slide: "幻灯片",
  sheet: "工作表",
  rowsTruncated: "仅显示前 {count} 行。",
  wrapLines: "自动换行",
  lineNumbers: "行号",
  transparencyGrid: "透明网格",
  handTool: "手形工具",
  selectTool: "文本选择工具",
  words: "{count} 个字",
  more: "更多",
};

/** Built-in translations. Add your own with {@link registerLocale}. */
export const locales: Record<string, Partial<Messages>> = { en, he, ar, es, fr, de, ru, zh };

/** Locales whose UI is right-to-left. */
export const RTL_LOCALES = ["he", "ar", "fa", "ur", "yi", "ps", "sd", "ug", "dv", "ku"];

/** Adds or extends a translation, e.g. `registerLocale("it", { open: "Apri file", ... })`. */
export function registerLocale(code: string, messages: Partial<Messages>): void {
  const key = code.toLowerCase();
  locales[key] = { ...(locales[key] ?? {}), ...messages };
}

function browserLocale(): string {
  try {
    const lang = typeof document !== "undefined" ? document.documentElement?.getAttribute("lang") : "";
    if (lang) return lang;
    return (typeof navigator !== "undefined" && navigator.language) || "en";
  } catch {
    return "en";
  }
}

/** Resolves a locale code ("he-IL" → "he") to a complete message set. */
export function resolveMessages(locale?: string, overrides?: Partial<Messages>): Messages {
  const code = (locale && locale !== "auto" ? locale : browserLocale()).toLowerCase();
  const pack = locales[code] ?? locales[code.split("-")[0]] ?? {};
  return { ...en, ...pack, ...(overrides ?? {}) };
}

export type Translate = (key: keyof Messages, vars?: Record<string, string | number>) => string;

/** Creates a translate function with `{placeholder}` interpolation. */
export function createTranslator(messages: Messages): Translate {
  return (key, vars) => {
    const text = messages[key] ?? en[key] ?? String(key);
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
  };
}

export function isRtlLocale(locale?: string): boolean {
  const code = (locale && locale !== "auto" ? locale : browserLocale()).toLowerCase().split("-")[0];
  return RTL_LOCALES.includes(code);
}
