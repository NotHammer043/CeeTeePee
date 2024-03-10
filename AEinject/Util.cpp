#include "Util.h"

BOOL _FileExists(const char* lpFile)
{
	BOOL bRet = FALSE;
	
	FILE *fp = fopen(lpFile, "r");

	if(fp != NULL) {
		bRet = TRUE;
		fclose(fp);
	}

	return bRet;
}

BOOL _IsExtension(const char* lpFile, const char* lpExpectedExtension)
{
	size_t n, x=0;

	if(strlen(lpFile) < strlen(lpExpectedExtension))
		return FALSE;

	n = strlen(lpFile) - strlen(lpExpectedExtension);

	while(n < strlen(lpFile))
	{
		if(tolower(lpFile[n++]) != tolower(lpExpectedExtension[x++]))
			return FALSE;
	}

	return TRUE;
}

int _safecmp(const char* p1, const char* p2)
{
	size_t n;

	if(strlen(p1) != strlen(p2)) return 1;

	for(n=0;n<strlen(p1);n++)
		if(p1[n] != p2[n]) return 1;

	return 0;
}
