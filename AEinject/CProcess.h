#ifndef __CPROCESS_H__
#define __CPROCESS_H__
#include <Windows.h>
#include <vector>

using namespace std;

class CProcess 
{
public:
	char m_szProcess[MAX_PATH];
	HWND m_hwndParent;
	BOOL m_bInjectOnStartup;
	CRITICAL_SECTION m_Lock;
	vector <char*> m_ModuleList;

	CProcess();

	void AddModule(const char* lpModule);
	void DelModule(const char* lpModule);

	~CProcess();
protected:
private:
};

class CProcessList
{
public:
	HWND m_hwndParent;
	vector <CProcess*> m_ProcessList;
	CRITICAL_SECTION m_Lock;
	CProcessList(HWND hwndParent);
	BOOL AddProcess(const char* lpProcess);
	void DelProcess(const char* lpProcess);
	~CProcessList();
protected:
private:
};

#endif
