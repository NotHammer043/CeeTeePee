#ifndef __UTIL_H__
#define __UTIL_H__
#include <Windows.h>
#include <stdio.h>

BOOL _FileExists(const char* lpFile);
BOOL _IsExtension(const char* lpFile, const char* lpExpectedExtension);
int _safecmp(const char* p1, const char* p2);

#endif
