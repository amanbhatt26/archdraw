from pycrdt import Map, Doc

root = Map({'aman':{'name':'Aman','lastName':'Bhatt'}})
doc = Doc()
doc['root'] = root


secondRoot = Map({'aman':{'name':'Aman','lastName':'Bhatt'}})
secondDoc = Doc()
secondDoc['root'] = secondRoot

secondRoot['naman'] = {'name':'Naman','lastName':'Ttahb'}

update1 = secondDoc.get_update()

secondRoot.pop('naman')

update2 = secondDoc.get_update()



doc.apply_update(update2)

print(doc.get('root',type=Map))

doc.apply_update(update1)

print(doc.get('root',type=Map))
print(secondDoc.get('root',type=Map))


