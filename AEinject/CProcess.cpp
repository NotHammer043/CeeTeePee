#include <stdio.h>
#include "CProcess.h"
#include "Util.h"

CProcess::CProcess()
{
	m_hwndParent = NULL;
	m_bInjectOnStartup = FALSE;
	memset(m_szProcess, 0, MAX_PATH);
	InitializeCriticalSection(&m_Lock);
}

void CProcess::AddModule(const char* lpModule)
{
	char* pNew = new char[strlen(lpModule) + 1];
	if(pNew != NULL)
	{
		memset(pNew, 0, strlen(lpModule) + 1);
		strcpy(pNew, lpModule);

		EnterCriticalSection(&m_Lock); // A little thread safety for our list

		BOOL bFound = FALSE;
		vector <char*>::iterator it;

		for(it=m_ModuleList.begin(); it!=m_ModuleList.end(); ++it)
		{
			char* ptr = *it;
			if(_safecmp(ptr, pNew) == 0) {
				bFound = TRUE;
				break;
			}
		}

		if(!bFound)
			m_ModuleList.push_back(pNew);
		else
			delete[] pNew;

		LeaveCriticalSection(&m_Lock);
	}
	else
	{
		MessageBox(m_hwndParent, "Memory Allocation Failed. Insufficient Memory?", "Error", MB_ICONEXCLAMATION | MB_OK);
	}
}

void CProcess::DelModule(const char* lpModule)
{
	vector <char *>::iterator it;

	EnterCriticalSection(&m_Lock);
	for(it=m_ModuleList.begin(); it!=m_ModuleList.end(); ++it)
	{
		char* ptr = *it;
		if(_safecmp(ptr, lpModule) == 0)
		{
			delete[] ptr;
			m_ModuleList.erase(it);
			break;
		}
	}
	LeaveCriticalSection(&m_Lock);
}

CProcess::~CProcess()
{
	vector<char*>::iterator it;

	EnterCriticalSection(&m_Lock);
	for(it=m_ModuleList.begin(); it!=m_ModuleList.end(); ++it) {
		char* ptr = *it;
		delete[] ptr;
	};

	m_ModuleList.clear();
	
	LeaveCriticalSection(&m_Lock);

	DeleteCriticalSection(&m_Lock);
}

CProcessList::CProcessList(HWND hwndParent)
{
	m_hwndParent = hwndParent;
	InitializeCriticalSection(&m_Lock);
}

BOOL CProcessList::AddProcess(const char* lpProcess)
{
	BOOL bRet = FALSE;
	BOOL bFound = FALSE;
	vector <CProcess*>::iterator it;

	EnterCriticalSection(&m_Lock);

	for(it=m_ProcessList.begin(); it!=m_ProcessList.end(); ++it)
	{
		CProcess* ptr = *it;
		if(_safecmp(ptr->m_szProcess, lpProcess) == 0) {
			bFound = TRUE;
			break;
		}
	}

	if(!bFound) {
		CProcess* Temp = new CProcess();
		if(Temp != NULL)
		{
			Temp->m_hwndParent = m_hwndParent;
			strcpy(Temp->m_szProcess, lpProcess);
			
			m_ProcessList.push_back(Temp);

			bRet = TRUE;
		}
		else
		{
			MessageBox(m_hwndParent, "Memory Allocation Failed. Insufficient Memory?", "Error", MB_ICONEXCLAMATION | MB_OK);
		}
	}

	LeaveCriticalSection(&m_Lock);

	return bRet;
}

void CProcessList::DelProcess(const char* lpProcess)
{
	vector <CProcess*>::iterator it;

	EnterCriticalSection(&m_Lock);

	for(it=m_ProcessList.begin(); it!=m_ProcessList.end(); ++it)
	{
		CProcess* ptr = *it;
		if(_safecmp(ptr->m_szProcess, lpProcess) == 0) {
			delete ptr;
			m_ProcessList.erase(it);
			break;
		}
	}

	LeaveCriticalSection(&m_Lock);
}

CProcessList::~CProcessList()
{
	vector <CProcess*>::iterator it;
	
	EnterCriticalSection(&m_Lock);
	
	for(it=m_ProcessList.begin(); it!=m_ProcessList.end(); ++it)
	{
		CProcess* Temp = *it;
		delete Temp;
	}

	m_ProcessList.clear();

	LeaveCriticalSection(&m_Lock);
	
	DeleteCriticalSection(&m_Lock);
}
