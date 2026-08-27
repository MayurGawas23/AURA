a = [1,2,3,4,5]
first = a[0]
for i in range(len(a)-1):
    a[i] = a[i+1]
a[-1] = first
print(a)