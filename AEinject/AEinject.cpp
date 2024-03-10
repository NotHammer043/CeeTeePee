
#ifdef _MSC_VER
#pragma comment(lib, "Psapi.lib")
#pragma comment(lib, "ComCtl32.lib")
#pragma comment(linker,"\"/manifestdependency:type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'\"")
#endif

#ifndef PSAPI_VERSION
#define PSAPI_VERSION 1
#endif

#include <Windows.h>
#include <CommCtrl.h>
#include <stdio.h>
#include <Psapi.h>
#include "CProcess.h"
#include "Util.h"
#include <wchar.h>
#include "resource.h"

HWND g_hwndMain = NULL;
NOTIFYICONDATA g_nid;
CProcessList* g_pProcessList = NULL;
HBRUSH g_hBrushBackground = NULL;
WNDPROC g_ListViewCallbackProc;
BOOL g_bKeepAlive = TRUE;

void ProcBrowse(void);
void AddProcess(void);
void LibBrowse(void);
void AddLibrary(void);
void ListModules(CProcess* pProc);
void ListProcesses(void);
void InjectCheck(void);
DWORD InjectThread(LPVOID lpParam);
void InjectModules(HANDLE hProcess, DWORD dwProcessID, CProcess* pProc);
void AppendConsole(const char* lpText);
CProcess* GetProcessPtr(const char* lpProcess);
void LoadConfig(void);
void SaveConfig(void);
void InjectNow(void);

BOOL CALLBACK DlgProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
	HMENU hPopupMenu;
	POINT pt;
	BOOL retVal = FALSE;
	switch(uMsg)
	{
	case WM_CLOSE:
		DestroyWindow(hwnd);
		break;
	case WM_DESTROY:
	{
		if (g_hBrushBackground != NULL)
		{
			DeleteObject(g_hBrushBackground);
			g_hBrushBackground = NULL;
		}
		PostQuitMessage(0);
	}
	break;

	case WM_USER+0x7F7F:
		switch(lParam)
		{
		case WM_LBUTTONDOWN:
			ShowWindow(hwnd, SW_SHOW);
			Shell_NotifyIcon(NIM_DELETE, &g_nid);
			SendMessage(hwnd, WM_SYSCOMMAND, (WPARAM)SC_RESTORE, (LPARAM)0);
			break;
		case WM_RBUTTONDOWN:
			GetCursorPos(&pt);
			hPopupMenu = CreatePopupMenu();
			InsertMenu(hPopupMenu, 0, MF_STRING, 30000, "Exit");
			TrackPopupMenu(hPopupMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, pt.x, pt.y, 0, hwnd, NULL);
			break;
		}
		break;
	case WM_INITDIALOG:
	{
		// Set the background color
		HBRUSH hBrush = CreateSolidBrush(RGB(30, 30, 30));
		SetClassLongPtr(hwnd, GCLP_HBRBACKGROUND, (LONG_PTR)hBrush);
		DeleteObject(hBrush);
	}
	break;

	case WM_DRAWITEM:
	{
		LPDRAWITEMSTRUCT pdis = reinterpret_cast<LPDRAWITEMSTRUCT>(lParam);

		// Handle drawing for the "+" button
		if (pdis->CtlID == IDC_PROCADD && pdis->itemAction == ODA_DRAWENTIRE)
		{
			// Determine the button rectangle
			RECT buttonRect = pdis->rcItem;

			// Set up device context for drawing
			HDC hdc = pdis->hDC;
			SetBkMode(hdc, TRANSPARENT);

			// Draw the button background (colored)
			COLORREF backgroundColor = RGB(55, 55, 55);  // Set your desired background color here
			HBRUSH hBrush = CreateSolidBrush(backgroundColor);
			FillRect(hdc, &buttonRect, hBrush);
			DeleteObject(hBrush);

			// Draw the button text
			HFONT hFont = (HFONT)SendMessage(pdis->hwndItem, WM_GETFONT, 0, 0);
			LOGFONT lf;
			GetObject(hFont, sizeof(LOGFONT), &lf);
			lf.lfCharSet = DEFAULT_CHARSET;
			HFONT hCustomFont = CreateFontIndirect(&lf);
			SelectObject(hdc, hCustomFont);
			SetTextColor(hdc, RGB(255, 255, 255));  // Set the text color
			DrawTextW(hdc, L"+", 1, &buttonRect, DT_SINGLELINE | DT_CENTER | DT_VCENTER);
			DeleteObject(hCustomFont);
		}
		// Handle drawing for the "📁" button
		else if (pdis->CtlID == IDC_PROCBROWSE && pdis->itemAction == ODA_DRAWENTIRE)
		{
			// Determine the button rectangle
			RECT buttonRect = pdis->rcItem;

			// Set up device context for drawing
			HDC hdc = pdis->hDC;
			SetBkMode(hdc, TRANSPARENT);

			// Draw the button background (colored)
			COLORREF backgroundColor = RGB(55, 55, 55);  // Set your desired background color here
			HBRUSH hBrush = CreateSolidBrush(backgroundColor);
			FillRect(hdc, &buttonRect, hBrush);
			DeleteObject(hBrush);

			// Draw the button text
			HFONT hFont = (HFONT)SendMessage(pdis->hwndItem, WM_GETFONT, 0, 0);
			LOGFONT lf;
			GetObject(hFont, sizeof(LOGFONT), &lf);
			lf.lfCharSet = DEFAULT_CHARSET;
			HFONT hCustomFont = CreateFontIndirect(&lf);
			SelectObject(hdc, hCustomFont);
			SetTextColor(hdc, RGB(255, 255, 255));  // Set the text color
			DrawTextW(hdc, L"📁", 1, &buttonRect, DT_SINGLELINE | DT_CENTER | DT_VCENTER);
			DeleteObject(hCustomFont);
		}
		// Handle drawing for the "Inject" button
		else if (pdis->CtlID == IDC_INJECTNOW && pdis->itemAction == ODA_DRAWENTIRE)
		{
			// Determine the button rectangle
			RECT buttonRect = pdis->rcItem;

			// Set up device context for drawing
			HDC hdc = pdis->hDC;
			SetBkMode(hdc, TRANSPARENT);

			// Draw the button background (colored)
			COLORREF backgroundColor = RGB(55, 55, 55);  // Set your desired background color here
			HBRUSH hBrush = CreateSolidBrush(backgroundColor);
			FillRect(hdc, &buttonRect, hBrush);
			DeleteObject(hBrush);

			// Draw the button text
			HFONT hFont = (HFONT)SendMessage(pdis->hwndItem, WM_GETFONT, 0, 0);
			LOGFONT lf;
			GetObject(hFont, sizeof(LOGFONT), &lf);
			lf.lfCharSet = DEFAULT_CHARSET;
			HFONT hCustomFont = CreateFontIndirect(&lf);
			SelectObject(hdc, hCustomFont);
			SetTextColor(hdc, RGB(255, 255, 255));  // Set the text color
			DrawTextW(hdc, L"Inject", -1, &buttonRect, DT_SINGLELINE | DT_CENTER | DT_VCENTER);
			DeleteObject(hCustomFont);
		}
		// Handle drawing for the "📂" button
		else if (pdis->CtlID == IDC_LIBBROWSE && pdis->itemAction == ODA_DRAWENTIRE)
		{
			// Determine the button rectangle
			RECT buttonRect = pdis->rcItem;

			// Set up device context for drawing
			HDC hdc = pdis->hDC;
			SetBkMode(hdc, TRANSPARENT);

			// Draw the button background (colored)
			COLORREF backgroundColor = RGB(55, 55, 55);  // Set your desired background color here
			HBRUSH hBrush = CreateSolidBrush(backgroundColor);
			FillRect(hdc, &buttonRect, hBrush);
			DeleteObject(hBrush);

			// Draw the button text
			HFONT hFont = (HFONT)SendMessage(pdis->hwndItem, WM_GETFONT, 0, 0);
			LOGFONT lf;
			GetObject(hFont, sizeof(LOGFONT), &lf);
			lf.lfCharSet = DEFAULT_CHARSET;
			HFONT hCustomFont = CreateFontIndirect(&lf);
			SelectObject(hdc, hCustomFont);
			SetTextColor(hdc, RGB(255, 255, 255));  // Set the text color
			DrawTextW(hdc, L"📂", 1, &buttonRect, DT_SINGLELINE | DT_CENTER | DT_VCENTER);
			DeleteObject(hCustomFont);
		}
		// Handle drawing for the "+" button
		else if (pdis->CtlID == IDC_LIBADD && pdis->itemAction == ODA_DRAWENTIRE)
		{
			// Determine the button rectangle
			RECT buttonRect = pdis->rcItem;

			// Set up device context for drawing
			HDC hdc = pdis->hDC;
			SetBkMode(hdc, TRANSPARENT);

			// Draw the button background (colored)
			COLORREF backgroundColor = RGB(55, 55, 55);  // Set your desired background color here
			HBRUSH hBrush = CreateSolidBrush(backgroundColor);
			FillRect(hdc, &buttonRect, hBrush);
			DeleteObject(hBrush);

			// Draw the button text
			HFONT hFont = (HFONT)SendMessage(pdis->hwndItem, WM_GETFONT, 0, 0);
			LOGFONT lf;
			GetObject(hFont, sizeof(LOGFONT), &lf);
			lf.lfCharSet = DEFAULT_CHARSET;
			HFONT hCustomFont = CreateFontIndirect(&lf);
			SelectObject(hdc, hCustomFont);
			SetTextColor(hdc, RGB(255, 255, 255));  // Set the text color
			DrawTextW(hdc, L"+", 1, &buttonRect, DT_SINGLELINE | DT_CENTER | DT_VCENTER);
			DeleteObject(hCustomFont);
		}
	}
	break;



	case WM_CTLCOLORDLG:
	{
		if (g_hBrushBackground == NULL)
			g_hBrushBackground = CreateSolidBrush(RGB(30, 30, 30));
		return (INT_PTR)g_hBrushBackground;
	}
	break;

	case WM_CTLCOLORSTATIC:
	{
		HDC hdcStatic = (HDC)wParam;
		SetTextColor(hdcStatic, RGB(255, 255, 255));
		SetBkMode(hdcStatic, TRANSPARENT);
		return (INT_PTR)g_hBrushBackground;
	}
	break;



	case WM_COMMAND:
		switch(wParam)
		{
		case IDC_PROCBROWSE:
			ProcBrowse();
			break;
		case IDC_PROCADD:
			AddProcess();
			break;
		case IDC_LIBBROWSE:
			LibBrowse();
			break;
		case IDC_LIBADD:
			AddLibrary();
			break;
		case IDC_STARTCHECK:
			InjectCheck();
			break;
		case IDC_INJECTNOW:
			InjectNow();
			break;
		case 30000:
			Shell_NotifyIcon(NIM_DELETE, &g_nid);
			DestroyWindow(hwnd);
			break;
		}
		break;
	default:
		return FALSE;
	}
	return TRUE;
}

LRESULT CALLBACK ListViewCallbackProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
	LRESULT retVal;
	int iSelectedItem;
	char szSelectedItem[MAX_PATH] = {0x00};
	vector <CProcess*>::iterator proc;
	CProcess* ptrProc;

	switch(uMsg)
	{
	case WM_COMMAND:
		retVal = CallWindowProc(g_ListViewCallbackProc, hwnd, uMsg, wParam, lParam);
		if(wParam == 10001)
		{
			iSelectedItem = ListView_GetNextItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), -1, LVNI_FOCUSED | LVNI_SELECTED);
			if(iSelectedItem != -1)
			{
				ListView_GetItemText(GetDlgItem(g_hwndMain, IDC_PROCLIST), iSelectedItem, 0, szSelectedItem, MAX_PATH);
				ListView_DeleteAllItems(GetDlgItem(g_hwndMain, IDC_LIBLIST));
				g_pProcessList->DelProcess(szSelectedItem);
				ListProcesses();
				SaveConfig();
			}
		}
		else if(wParam == 20001)
		{
			iSelectedItem = ListView_GetNextItem(GetDlgItem(g_hwndMain, IDC_LIBLIST), -1, LVNI_FOCUSED | LVNI_SELECTED);
			int iSelProc = ListView_GetNextItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), -1, LVNI_FOCUSED | LVNI_SELECTED);
			if(iSelectedItem != -1 && iSelProc != -1)
			{
				char szProc[MAX_PATH] = {0x00};
				ListView_GetItemText(GetDlgItem(g_hwndMain, IDC_LIBLIST), iSelectedItem, 0, szSelectedItem, MAX_PATH);
				ListView_GetItemText(GetDlgItem(g_hwndMain, IDC_PROCLIST), iSelProc, 0, szProc, MAX_PATH);

				CProcess* proc = GetProcessPtr(szProc);
				if(proc != NULL)
				{
					proc->DelModule(szSelectedItem);
				}

				ListModules(proc);
				SaveConfig();
			}
		}
		return retVal;
	case WM_RBUTTONDOWN:
		retVal = CallWindowProc(g_ListViewCallbackProc, hwnd, uMsg, wParam, lParam);
		iSelectedItem = ListView_GetNextItem(hwnd, -1, LVNI_FOCUSED | LVNI_SELECTED);
		ListView_GetItemText(hwnd, iSelectedItem, 0, szSelectedItem, MAX_PATH);
		if(iSelectedItem != -1)
		{
			if(hwnd == GetDlgItem(g_hwndMain, IDC_PROCLIST))
			{
				POINT pt;
				GetCursorPos(&pt);

				HMENU hPopupMenu = CreatePopupMenu();
				InsertMenu(hPopupMenu, 0, MF_STRING | MF_DISABLED, 10000, szSelectedItem);
				InsertMenu(hPopupMenu, 0, MF_STRING, 10001, "Remove Process");

				TrackPopupMenu(hPopupMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, pt.x, pt.y, 0, hwnd, NULL);
			}
			else if(hwnd == GetDlgItem(g_hwndMain, IDC_LIBLIST))
			{
				POINT pt;
				GetCursorPos(&pt);

				HMENU hPopupMenu = CreatePopupMenu();
				InsertMenu(hPopupMenu, 0, MF_STRING | MF_DISABLED, 20000, szSelectedItem);
				InsertMenu(hPopupMenu, 0, MF_STRING, 20001, "Remove Library");

				TrackPopupMenu(hPopupMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, pt.x, pt.y, 0, hwnd, NULL);
			}
		}
		return retVal;
	case WM_KEYUP:
	case WM_KEYDOWN:
	case WM_LBUTTONDOWN:
		retVal = CallWindowProc(g_ListViewCallbackProc, hwnd, uMsg, wParam, lParam);
		iSelectedItem = ListView_GetNextItem(hwnd, -1, LVNI_FOCUSED | LVNI_SELECTED);
		if(iSelectedItem != -1)
		{
			if(hwnd == GetDlgItem(g_hwndMain, IDC_PROCLIST)) {
				EnableWindow(GetDlgItem(g_hwndMain, IDC_STARTCHECK), TRUE);
				EnableWindow(GetDlgItem(g_hwndMain, IDC_INJECTNOW), TRUE);
				ListView_GetItemText(hwnd, iSelectedItem, 0, szSelectedItem, MAX_PATH);
				
				EnterCriticalSection(&g_pProcessList->m_Lock);

				for(proc=g_pProcessList->m_ProcessList.begin();
					proc != g_pProcessList->m_ProcessList.end();
					++proc)
				{
					ptrProc = *proc;
					if(_safecmp(ptrProc->m_szProcess, szSelectedItem) == 0)
					{
						if(ptrProc->m_bInjectOnStartup)
						{
							SendMessage(GetDlgItem(g_hwndMain, IDC_STARTCHECK), BM_SETCHECK, (WPARAM)BST_CHECKED, (LPARAM)0);
							EnableWindow(GetDlgItem(g_hwndMain, IDC_INJECTNOW), FALSE);
						}
						else
						{
							SendMessage(GetDlgItem(g_hwndMain, IDC_STARTCHECK), BM_SETCHECK, (WPARAM)BST_UNCHECKED, (LPARAM)0);
							EnableWindow(GetDlgItem(g_hwndMain, IDC_INJECTNOW), TRUE);
						}


						ListModules(ptrProc);
						break;
					}
				}

				LeaveCriticalSection(&g_pProcessList->m_Lock);
			}
		}
		else
		{
			if(hwnd == GetDlgItem(g_hwndMain, IDC_PROCLIST))
			{
				ListView_DeleteAllItems(GetDlgItem(g_hwndMain, IDC_LIBLIST));
				EnableWindow(GetDlgItem(g_hwndMain, IDC_STARTCHECK), FALSE);
				SendMessage(GetDlgItem(g_hwndMain, IDC_STARTCHECK), BM_SETCHECK, (WPARAM)0, (LPARAM)BST_UNCHECKED);
				EnableWindow(GetDlgItem(g_hwndMain, IDC_INJECTNOW), FALSE);
			}
		}
		return retVal;
	default:
		return CallWindowProc(g_ListViewCallbackProc, hwnd, uMsg, wParam, lParam);
	}
	return 0;
}

LRESULT CALLBACK ButtonProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam, UINT_PTR uIdSubclass, DWORD_PTR dwRefData)
{
	switch (msg)
	{

	}

	return DefSubclassProc(hwnd, msg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
	InitCommonControls();

	g_hwndMain = CreateDialog(hInstance, MAKEINTRESOURCE(IDD_MAIN), HWND_DESKTOP, (DLGPROC)DlgProc);

	if(!g_hwndMain) {
		MessageBox(NULL, "Main Window Creation Failed!", "Fatal Error", MB_ICONEXCLAMATION | MB_OK);
		return 0;
	}

	SetClassLong(g_hwndMain, GCL_HICON, (LONG)LoadIcon(hInstance, MAKEINTRESOURCE(IDI_MAIN)));

	g_pProcessList = new CProcessList(g_hwndMain);

	if(g_pProcessList != NULL) {

		LVCOLUMN lvc;
		memset(&lvc, 0, sizeof(LVCOLUMN));

		g_ListViewCallbackProc = (WNDPROC)SetWindowLong(GetDlgItem(g_hwndMain, IDC_PROCLIST), GWL_WNDPROC, (LONG)ListViewCallbackProc);
		SetWindowLong(GetDlgItem(g_hwndMain, IDC_LIBLIST), GWL_WNDPROC, (LONG)ListViewCallbackProc);

		ListView_SetExtendedListViewStyleEx(GetDlgItem(g_hwndMain, IDC_PROCLIST), 0, LVS_EX_FULLROWSELECT);
		ListView_SetExtendedListViewStyleEx(GetDlgItem(g_hwndMain, IDC_LIBLIST), 0, LVS_EX_FULLROWSELECT);
	
		lvc.mask = LVCF_FMT | LVCF_WIDTH | LVCF_TEXT | LVCF_SUBITEM;
		lvc.fmt = LVCFMT_LEFT;
		lvc.cx = 563;
		lvc.pszText = "Executable";
		lvc.iSubItem = 0;

		ListView_InsertColumn(GetDlgItem(g_hwndMain, IDC_PROCLIST), 0, &lvc);

		lvc.pszText = "DLL";

		ListView_InsertColumn(GetDlgItem(g_hwndMain, IDC_LIBLIST), 0, &lvc);


		CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)InjectThread, NULL, 0, NULL);
		AppendConsole("------------------------------------------------- AEinjector -------------------------------------------------");

		LoadConfig();

		ShowWindow(g_hwndMain, nCmdShow);
		UpdateWindow(g_hwndMain);
		
		MSG Msg;

		while(GetMessage(&Msg, NULL, 0, 0) > 0) {
			TranslateMessage(&Msg);
			DispatchMessage(&Msg);
		}

		g_bKeepAlive = FALSE;

		delete g_pProcessList;

		return Msg.wParam;
	}
	else
	{
		MessageBox(g_hwndMain, "Memory Allocation Failed. Insufficient Memory?", "Error", MB_ICONEXCLAMATION | MB_OK);
	}
	return 0;
}

void ProcBrowse(void)
{
	OPENFILENAME ofn;
	char szFileName[MAX_PATH] = {0x00};

	memset(&ofn, 0, sizeof(ofn));

	ofn.hwndOwner = g_hwndMain;
	ofn.lStructSize = sizeof(ofn);
	ofn.lpstrFilter = "Executable File (*.exe)\0*.exe\0";
	ofn.lpstrFile = szFileName;
	ofn.nMaxFile = MAX_PATH;
	ofn.Flags = OFN_EXPLORER | OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;
	ofn.lpstrDefExt = "exe";

	if(GetOpenFileName(&ofn))
	{
		SendMessage(GetDlgItem(g_hwndMain, IDC_PROCEDIT), WM_SETTEXT, (WPARAM)0, (LPARAM)szFileName);
	}
}

void AddProcess(void)
{
	char szProcess[MAX_PATH] = {0x00};
	SendMessage(GetDlgItem(g_hwndMain, IDC_PROCEDIT), WM_GETTEXT, (WPARAM)MAX_PATH, (LPARAM)szProcess);

	if(strlen(szProcess) <= 0)
	{
		MessageBox(g_hwndMain, "You haven't entered a process path.", "Error", MB_ICONEXCLAMATION | MB_OK);
	}
	else
	{
		if(_FileExists(szProcess))
		{
			if(_IsExtension(szProcess, ".exe"))
			{
				if(g_pProcessList->AddProcess(szProcess))
				{
					LVITEM lvi;
					memset(&lvi, 0, sizeof(LVITEM));
					lvi.mask = LVIF_TEXT;
					lvi.iItem = ((int)g_pProcessList->m_ProcessList.size() - 1);
					lvi.iSubItem = 0;
					lvi.pszText = szProcess;
					
					ListView_InsertItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), &lvi);
				}
				SendMessage(GetDlgItem(g_hwndMain, IDC_PROCEDIT), WM_SETTEXT, (WPARAM)0, (LPARAM)"");
			}
			else
			{
				MessageBox(g_hwndMain, "The specified file is not an Exectuable File (*.exe)", "Error", MB_ICONEXCLAMATION | MB_OK);
			}
		}
		else
		{
			char szBuffer[2048] = {0x00};
			sprintf(szBuffer, "File: \r\n%s\r\nDoes not exist, or is inaccessible.", szProcess);
			MessageBox(g_hwndMain, szBuffer, "Error", MB_ICONEXCLAMATION | MB_OK);
		}
	}

	SaveConfig();
}

void LibBrowse(void)
{
	OPENFILENAME ofn;
	char szFileName[MAX_PATH] = {0x00};

	memset(&ofn, 0, sizeof(ofn));

	ofn.hwndOwner = g_hwndMain;
	ofn.lStructSize = sizeof(ofn);
	ofn.lpstrFilter = "Dynamic Link Library (*.dll)\0*.dll\0";
	ofn.lpstrFile = szFileName;
	ofn.nMaxFile = MAX_PATH;
	ofn.Flags = OFN_EXPLORER | OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;
	ofn.lpstrDefExt = "dll";

	if(GetOpenFileName(&ofn))
	{
		SendMessage(GetDlgItem(g_hwndMain, IDC_LIBEDIT), WM_SETTEXT, (WPARAM)0, (LPARAM)szFileName);
	}
}

void AddLibrary(void)
{
	char szLibrary[MAX_PATH] = {0x00};
	char szProcess[MAX_PATH] = {0x00};
	int nProcItem = ListView_GetNextItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), -1, LVNI_FOCUSED | LVNI_SELECTED);
	if(nProcItem != -1)
	{
		ListView_GetItemText(GetDlgItem(g_hwndMain, IDC_PROCLIST), nProcItem, 0, szProcess, MAX_PATH);

		SendMessage(GetDlgItem(g_hwndMain, IDC_LIBEDIT), WM_GETTEXT, (WPARAM)MAX_PATH, (LPARAM)szLibrary);

		if(strlen(szLibrary) <= 0)
		{
			MessageBox(g_hwndMain, "You haven't entered a library path.", "Error", MB_ICONEXCLAMATION | MB_OK);
		}
		else
		{
			if(_FileExists(szLibrary))
			{
				if(_IsExtension(szLibrary, ".dll"))
				{
					BOOL bFound = FALSE;
					vector <CProcess*>::iterator proc;

					EnterCriticalSection(&g_pProcessList->m_Lock);

					for(proc=g_pProcessList->m_ProcessList.begin(); proc!=g_pProcessList->m_ProcessList.end(); ++proc)
					{
						CProcess* ptr = *proc;
						if(_safecmp(ptr->m_szProcess, szProcess) == 0)
						{
							ptr->AddModule(szLibrary);
							ListModules(ptr);
							bFound = TRUE;
							break;
						}
					}

					LeaveCriticalSection(&g_pProcessList->m_Lock);

					SendMessage(GetDlgItem(g_hwndMain, IDC_LIBEDIT), WM_SETTEXT, (WPARAM)0, (LPARAM)"");

					if(!bFound)
					{
						MessageBox(g_hwndMain, "Oops! Selected process could not be found. Please report this bug immediately!", "Error", MB_ICONEXCLAMATION | MB_OK);
					}
				}
				else
				{
					MessageBox(g_hwndMain, "The specified file is not a Dynamic Link Library (*.dll)", "Error", MB_ICONEXCLAMATION | MB_OK);
				}
			}
			else
			{
				char szBuffer[2048] = {0x00};
				sprintf(szBuffer, "File: \r\n%s\r\nDoes not exist, or is inaccessible.", szLibrary);
				MessageBox(g_hwndMain, szBuffer, "Error", MB_ICONEXCLAMATION | MB_OK);
			}
		}
	}
	else
	{
		MessageBox(g_hwndMain, "You haven't selected a process.", "Error", MB_ICONEXCLAMATION | MB_OK);
	}

	SaveConfig();
}

void ListModules(CProcess* pProc)
{
	vector <char*>::iterator it;
	LVITEM lvi;
	int iItem = 0;

	memset(&lvi, 0, sizeof(LVITEM));

	ListView_DeleteAllItems(GetDlgItem(g_hwndMain, IDC_LIBLIST));

	EnterCriticalSection(&pProc->m_Lock);

	for(it=pProc->m_ModuleList.begin(); it!=pProc->m_ModuleList.end(); ++it)
	{
		char* pmod = *it;

		lvi.mask = LVIF_TEXT;
		lvi.iItem = iItem;
		lvi.iSubItem = 0;
		lvi.pszText = pmod;

		ListView_InsertItem(GetDlgItem(g_hwndMain, IDC_LIBLIST), &lvi);

		iItem++;
		
	}

	LeaveCriticalSection(&pProc->m_Lock);
}


void ListProcesses(void)
{
	vector <CProcess*>::iterator it;
	LVITEM lvi;
	int iItem = 0;

	memset(&lvi, 0, sizeof(LVITEM));

	ListView_DeleteAllItems(GetDlgItem(g_hwndMain, IDC_PROCLIST));

	EnterCriticalSection(&g_pProcessList->m_Lock);

	for(it=g_pProcessList->m_ProcessList.begin(); 
		it!=g_pProcessList->m_ProcessList.end();
		++it)
	{
		CProcess* ptr = *it;

		lvi.mask = LVIF_TEXT;
		lvi.iItem = iItem;
		lvi.iSubItem = 0;
		lvi.pszText = ptr->m_szProcess;

		ListView_InsertItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), &lvi);

		iItem++;
		
	}

	LeaveCriticalSection(&g_pProcessList->m_Lock);
}

void InjectCheck(void)
{
	char szProcess[MAX_PATH] = {0x00};
	vector <CProcess*>::iterator proc;
	int iSelProc = ListView_GetNextItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), -1, LVNI_FOCUSED | LVNI_SELECTED);

	if(iSelProc != -1)
	{
		ListView_GetItemText(GetDlgItem(g_hwndMain, IDC_PROCLIST), iSelProc, 0, szProcess, MAX_PATH);

		EnterCriticalSection(&g_pProcessList->m_Lock);

		for(proc=g_pProcessList->m_ProcessList.begin();
			proc!=g_pProcessList->m_ProcessList.end();
			++proc)
		{
			CProcess* ptr = *proc;
			if(_safecmp(ptr->m_szProcess, szProcess) == 0)
			{
				BOOL bTemp = (SendMessage(GetDlgItem(g_hwndMain, IDC_STARTCHECK), BM_GETCHECK, (WPARAM)0, (LPARAM)0)==BST_CHECKED)? TRUE : FALSE;
				
				ptr->m_bInjectOnStartup = bTemp;
				
				if(!bTemp)
				{
					EnableWindow(GetDlgItem(g_hwndMain, IDC_INJECTNOW), TRUE);
				}
				else
				{
					EnableWindow(GetDlgItem(g_hwndMain, IDC_INJECTNOW), FALSE);
				}

				break;
			}
		}

		LeaveCriticalSection(&g_pProcessList->m_Lock);
	}
	else
	{
		EnableWindow(GetDlgItem(g_hwndMain, IDC_STARTCHECK), FALSE);
		SendMessage(GetDlgItem(g_hwndMain, IDC_STARTCHECK), BM_SETCHECK, (WPARAM)0, (LPARAM)BST_UNCHECKED);
	}
	SaveConfig();
}

DWORD InjectThread(LPVOID lpParam)
{
	while(g_bKeepAlive)
	{
		DWORD dwProcessList[1024] = {0x00000000};
		DWORD dwNeeded;
		DWORD dwCount;
		unsigned int i;
		vector <CProcess*>::iterator proc;
		if(g_pProcessList->m_ProcessList.size() > 0)
		{
			if(EnumProcesses(dwProcessList, sizeof(dwProcessList), &dwNeeded))
			{
				dwCount = dwNeeded / sizeof(DWORD);

				for(i = 0; i < dwCount; i++)
				{
					char szProcess[MAX_PATH] = {0x00};
					HANDLE hProcess;

					hProcess = OpenProcess(PROCESS_CREATE_THREAD
										|PROCESS_QUERY_INFORMATION|PROCESS_VM_READ|
										PROCESS_VM_WRITE|PROCESS_VM_OPERATION, FALSE, 
										dwProcessList[i]);

					if(hProcess != NULL)
					{

						if(GetModuleFileNameEx(hProcess, NULL, szProcess, MAX_PATH))
						{
							EnterCriticalSection(&g_pProcessList->m_Lock);

							for(proc=g_pProcessList->m_ProcessList.begin();
								proc!=g_pProcessList->m_ProcessList.end();
								++proc)
							{
								CProcess* ptr = *proc;
								if(ptr->m_bInjectOnStartup && _safecmp(szProcess, ptr->m_szProcess) == 0)
								{
									InjectModules(hProcess, dwProcessList[i], ptr);
									break;
								}
							}

							LeaveCriticalSection(&g_pProcessList->m_Lock);

							CloseHandle(hProcess);
						}
					}
				}
			}
		}

		Sleep(500);
	}
	return 0;
}

void InjectModules(HANDLE hProcess, DWORD dwProcessID, CProcess* pProc)
{
	HMODULE hModList[1024] = {NULL};
	DWORD dwModulesNeeded;
	DWORD dwModuleCount;
	vector <char*>::iterator mod;
	unsigned int i;

	if(EnumProcessModules(hProcess, hModList, sizeof(hModList), &dwModulesNeeded))
	{

		dwModuleCount = dwModulesNeeded / sizeof(HMODULE);

		EnterCriticalSection(&pProc->m_Lock);
				
		for(mod=pProc->m_ModuleList.begin();
			mod!=pProc->m_ModuleList.end();
			++mod)
		{
			char* ptr = *mod;
			BOOL bFound = FALSE;

			for(i = 0; i < dwModuleCount; i++)
			{
				char szModuleName[MAX_PATH] = {0x00};

				if(GetModuleFileNameEx(hProcess, hModList[i], szModuleName, MAX_PATH))
				{
					if(_safecmp(ptr, szModuleName) == 0)
					{
						bFound = TRUE;
						break;
					}
				}
			}

			if (!bFound)
			{
				char szAppend[4096] = { 0x00 };
				char szProcessName[MAX_PATH] = { 0x00 };
				char szDllName[MAX_PATH] = { 0x00 };
				char* pProcessName = strrchr(pProc->m_szProcess, '\\');
				char* pDllName = strrchr(ptr, '\\');
				if (pProcessName)
				{
					strncpy(szProcessName, pProcessName + 1, sizeof(szProcessName) - 1);
					szProcessName[sizeof(szProcessName) - 1] = '\0';
				}
				else
				{
					strncpy(szProcessName, pProc->m_szProcess, sizeof(szProcessName) - 1);
					szProcessName[sizeof(szProcessName) - 1] = '\0';
				}
				if (pDllName)
				{
					strncpy(szDllName, pDllName + 1, sizeof(szDllName) - 1);
					szDllName[sizeof(szDllName) - 1] = '\0';
				}
				else
				{
					strncpy(szDllName, ptr, sizeof(szDllName) - 1);
					szDllName[sizeof(szDllName) - 1] = '\0';
				}

				sprintf(szAppend, "\r\nProcess: %s\r\nPID: %d\r\nDLL: %s\r\n", szProcessName, dwProcessID, szDllName);

				AppendConsole(szAppend);
				memset(szAppend, 0, 4096);

				LPVOID pLoadLibrary = (LPVOID)GetProcAddress(GetModuleHandle("kernel32.dll"), "LoadLibraryA");
				LPVOID pMem = (LPVOID)VirtualAllocEx(hProcess, NULL, strlen(ptr) + 1, MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);

				WriteProcessMemory(hProcess, pMem, ptr, strlen(ptr) + 1, NULL);

				HANDLE hThread = NULL;

				if ((hThread = CreateRemoteThread(hProcess, NULL, NULL, (LPTHREAD_START_ROUTINE)pLoadLibrary, pMem, NULL, NULL)) == NULL)
				{
					sprintf(szAppend, "Injection failed - CreateRemoteThread() exited with error code %d\r\n", GetLastError());
					AppendConsole(szAppend);
				}
				else
				{
					AppendConsole("---------- Injected! ----------\r\n");
					WaitForSingleObject(hThread, INFINITE);
				}

				VirtualFreeEx(hProcess, pMem, 0, MEM_RELEASE);
			}

		}

		LeaveCriticalSection(&pProc->m_Lock);
	}

}

void AppendConsole(const char* lpText)
{
	char szAppend[4096] = {0x00};

	strcpy(szAppend, lpText);
	
	unsigned int nLen = SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), WM_GETTEXTLENGTH, (WPARAM)0, (LPARAM)0);
	SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_SETSEL, (WPARAM)nLen, (LPARAM)nLen);
	SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_REPLACESEL, (WPARAM)0, (LPARAM)szAppend);

	nLen = SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), WM_GETTEXTLENGTH, (WPARAM)0, (LPARAM)0);
	SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_SETSEL, (WPARAM)nLen, (LPARAM)nLen);

	int iLines = SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_GETLINECOUNT, (WPARAM)0, (LPARAM)0);
	while(iLines > 301) {
		char szBuf[4096] = {0x00};
		SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_GETLINE, (WPARAM)0, (LPARAM)szBuf);
		SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_SETSEL, (WPARAM)1, (LPARAM)lstrlen(szBuf));
		SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_REPLACESEL, (WPARAM)0, (LPARAM)"");
		iLines = SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_GETLINECOUNT, (WPARAM)0, (LPARAM)0);
	}

	SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), WM_VSCROLL, (WPARAM)SB_BOTTOM, (LPARAM)0);
	nLen = SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), WM_GETTEXTLENGTH, (WPARAM)0, (LPARAM)0);
	SendMessage(GetDlgItem(g_hwndMain, IDC_CONSOLE), EM_SETSEL, (WPARAM)nLen, (LPARAM)nLen);
}

CProcess* GetProcessPtr(const char* lpProcess)
{
	CProcess* pRet = NULL;
	vector <CProcess*>::iterator proc;

	EnterCriticalSection(&g_pProcessList->m_Lock);

	for(proc=g_pProcessList->m_ProcessList.begin();
		proc!=g_pProcessList->m_ProcessList.end();
		++proc)
	{
		CProcess* ptr = *proc;
		if(_safecmp(lpProcess, ptr->m_szProcess) == 0){
			pRet = ptr;
			break;
		}
	}

	LeaveCriticalSection(&g_pProcessList->m_Lock);

	return pRet;
}

void LoadConfig(void)
{
	char szFile[MAX_PATH * 2] = {0x00};
	GetModuleFileName(NULL, szFile, MAX_PATH * 2);

	for(unsigned int i = strlen(szFile); i > 0; i--)
	{
		if(szFile[i] == '\\') 
			break;
		else
			szFile[i] = 0x00;
	}


	strcat(szFile, "aeconfig.ini");
	FILE* fp = fopen(szFile, "rb");
	if(fp != NULL)
	{
		char szCurrentProc[MAX_PATH] = {0x00};
		char szBuf[4096] = {0x00};
		while(fgets(szBuf, 4096, fp) != NULL)
		{
			for(unsigned int i = 0; i < strlen(szBuf); i++){
				if(szBuf[i] == '\r' || szBuf[i] == '\n') {
					szBuf[i] = 0x00;
				}
			}

			if(strnicmp(szBuf, "process=", strlen("process=")) == 0)
			{
				if(strlen(szBuf + strlen("process=")) <= MAX_PATH)
				{
					if(g_pProcessList->AddProcess(szBuf + strlen("process=")))
					{
						memset(szCurrentProc, 0, MAX_PATH);
						strcpy(szCurrentProc, szBuf + strlen("process="));
					}
				}
			}
			else if(strnicmp(szBuf, "injectonstartup=", strlen("injectonstartup=")) == 0)
			{
				int n = atoi(szBuf + strlen("injectonstartup="));
				if(n > 0)
				{
					CProcess* ptr = GetProcessPtr(szCurrentProc);
					if(ptr != NULL)
						ptr->m_bInjectOnStartup = TRUE;
				}
			}
			else if(strnicmp(szBuf, "addlib=", strlen("addlib=")) == 0)
			{
				if(strlen(szBuf + strlen("addlib=")) <= MAX_PATH)
				{
					CProcess* ptr = GetProcessPtr(szCurrentProc);
					if(ptr != NULL)
					{
						ptr->AddModule(szBuf + strlen("addlib="));
					}
				}
			}

			memset(szBuf, 0, 4096);
		}
		fclose(fp);
	}

	ListProcesses();
}

void SaveConfig(void)
{
	char szFile[MAX_PATH * 2] = {0x00};
	GetModuleFileName(NULL, szFile, MAX_PATH * 2);

	for(unsigned int i = strlen(szFile); i > 0; i--)
	{
		if(szFile[i] == '\\') 
			break;
		else
			szFile[i] = 0x00;
	}

	strcat(szFile, "aeconfig.ini");
	FILE* fp = fopen(szFile, "wb");

	if(fp != NULL)
	{
		vector <CProcess*>::iterator proc;

		EnterCriticalSection(&g_pProcessList->m_Lock);

		for(proc=g_pProcessList->m_ProcessList.begin();
			proc!=g_pProcessList->m_ProcessList.end();
			++proc)
		{
			CProcess* ptr = *proc;
			fprintf(fp, "Process=%s\r\n", ptr->m_szProcess); 
			fprintf(fp, "InjectOnStartup=%d\r\n", (int)(ptr->m_bInjectOnStartup));
			
			vector <char*>::iterator mod;

			EnterCriticalSection(&ptr->m_Lock);

			for(mod=ptr->m_ModuleList.begin();
				mod!=ptr->m_ModuleList.end();
				++mod)
			{
				char* pstr = *mod;

				fprintf(fp, "AddLib=%s\r\n", pstr);
			}

			LeaveCriticalSection(&ptr->m_Lock);

		}

		LeaveCriticalSection(&g_pProcessList->m_Lock);

		fclose(fp);
	}
}

void InjectNow(void)
{
	char szProcess[MAX_PATH] = {0x00};
	int iSelProc = ListView_GetNextItem(GetDlgItem(g_hwndMain, IDC_PROCLIST), -1, LVNI_FOCUSED | LVNI_SELECTED);
	
	if(iSelProc != -1)
	{
		ListView_GetItemText(GetDlgItem(g_hwndMain, IDC_PROCLIST), iSelProc, 0, szProcess, MAX_PATH);

		CProcess* proc = GetProcessPtr(szProcess);

		if(proc != NULL)
		{
			DWORD dwProcesses[1024] = {0x00000000};
			DWORD dwNeeded;
			DWORD dwCount;

			if(EnumProcesses(dwProcesses, sizeof(dwProcesses), &dwNeeded))
			{
				dwCount = dwNeeded / sizeof(DWORD);

				for(unsigned int i = 0; i < dwCount; i++)
				{
					HANDLE hProcess = OpenProcess(PROCESS_CREATE_THREAD
										|PROCESS_QUERY_INFORMATION|PROCESS_VM_READ|
										PROCESS_VM_WRITE|PROCESS_VM_OPERATION, FALSE, 
										dwProcesses[i]);

					if(hProcess != NULL)
					{
						char szTemp[MAX_PATH] = {0x00};
						GetModuleFileNameEx(hProcess, NULL, szTemp, MAX_PATH);
						if(_safecmp(szTemp, szProcess) == 0)
						{
							InjectModules(hProcess, dwProcesses[i], proc);
						}
						CloseHandle(hProcess);
					}
				}
			}
		}
	}
}
