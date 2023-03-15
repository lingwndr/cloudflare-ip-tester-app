import { AppI18n } from "@/localize";
import { APP_THEME } from "@/theme";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Linking, Pressable, FlatList, TouchableOpacity, Alert, TextInput } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Button, Switch } from "react-native-paper";
import { Text, View } from "../components/Themed";
import { useTheme } from "@react-navigation/native";
import { MaterialCommunityIcons, SimpleLineIcons  } from '@expo/vector-icons';
import { miniStyle } from "@/theme";
import { storeJson, getStoredJson } from "@/storage/localStorage";
import { deleteRecord, addRecord, getAllRecords, verifyToken, verifyZone} from "@/services/cfApi";

export default function ModalScreen() {
  const [cfKey, setCfKey] = useState('');
  const [domain, setDomain] = useState('');
  const [subDomain, setSubDomain] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [ips, setIps] = useState([]);
  const [ipAdd, setIpAdd] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [savedZone, setSavedZone] = useState({});
  const [keyDisabled, setKeyDisabled] = useState(false);
  const [zoneDisabled, setZoneDisabled] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    getStoredJson('cfKey', {cfKey: ''}).then(res => {
      setCfKey(res['cfKey']);
      setSavedKey(res['cfKey']);
      if(res['cfKey'] !== ''){
        setKeyDisabled(true);
      }
    });
    getStoredJson('zone', {}).then(res => {
      setDomain(res['domain']);
      setSubDomain(res['subDomain']);
      setZoneId(res['zoneId']);
      setSavedZone({
        domain: res['domain'],
        subDomain: res['subDomain'],
        zoneID: res['zoneId']
      });
      if(res['zone'] !== ''){
        console.log('here')
        setZoneDisabled(true);
      }
    });
  }, [])

  const handleKeyChange = (val) => {
    //console.log(val);
    if(savedKey === val && val !== ''){
      setKeyDisabled(true)
    }
    else{
      setKeyDisabled(false)
    }
    setCfKey(val)
  }

  const handleZoneChange = (val) => {
    if(savedZone['subDomain'] === val && val !== ''){
      setZoneDisabled(true)
    }
    else{
      setZoneDisabled(false)
    }
    setSubDomain(val)
    setDomain(val.split(".").splice(1).join('.'));
  }

  const keyExtractor = (item) => item.id;
  const renderItem = ({ item, index }) => (
    <View
      index={index}
      style={styles.item}
      >
      <Text>
        {item.content}
      </Text>
      <Text>
        {item.type}
      </Text>
      <Text>
        {item.created_on.substr(0, 10)}
      </Text>
      <View>
        <TouchableOpacity
          onPress={async () => {
            console.log(item.id)
            Alert.alert('Deleting', 'Are you sure you want to delete ' + item.content, [
              {
                text: 'No'
              },
              {
                text: 'Yes',
                onPress: async () => {
                  deleteRecord(cfKey, zoneId, item.id, function(err, res){
                    if(err){
                      alert('Problem in deleting ' + item.content);
                    }
                    else{
                      if(res?.data?.success){
                        setIps(ips.filter(ip => ip.id != item.id))
                      }
                    }
                  })
                }
              }
            ])
          }}
        >
          <MaterialCommunityIcons name="delete-forever-outline" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const ListHeader = () => (
    <View style={styles.item} >
      <Text>IP</Text>
      <Text>Record Type</Text>
      <Text>Creation date</Text>
      <Text>Delete</Text>
    </View>
  )
  return (
    <View style={styles.container}>
      <View style={styles.list}>
        <Text>
          CloudFlare's API key
        </Text>
        <TextInput
          style={[
            styles.input,
            keyDisabled ? styles.verified : null
            ]}
          value={cfKey}
          onChangeText={handleKeyChange}>
        </TextInput>
        <Button
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
          style={styles.buttonStyle}
          disabled={keyDisabled}
          mode="contained"
          onPress={() => {
            verifyToken(cfKey, function(err, res){
              if(err){
                console.log(err);
                if(err?.message){
                  alert(JSON.stringify(err?.message));
                }else{
                  alert(JSON.stringify(err));
                }
              }
              else{
                if (res?.data?.messages.length > 0){
                  storeJson('cfKey', {cfKey: cfKey});
                  setKeyDisabled(true);
                  alert(res?.data?.messages[0].message);
                }
              }
            })
          }}>
            {keyDisabled ? 'Stored Token is verified' : 'Verify and Save the Token'}
        </Button>
        <Text>
          Your sub-domain bound to Cloudflare's IPs:
        </Text>
        <TextInput
          style={[
            styles.input,
            zoneDisabled ? styles.verified : null
            ]}
          value={subDomain}
          onChangeText={handleZoneChange}
          placeholder={"sub.example.com"}
        >
        </TextInput>
        <Button
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
          style={styles.buttonStyle}
          disabled={zoneDisabled}
          mode="contained"
          onPress={() => {
            verifyZone(cfKey, domain, function(err, res){
              if(err){
                console.log(err);
                alert('A problem occured during gettig zone Id')
              }
              else if(res?.data?.result?.length > 0){
                storeJson('zone', {
                  subDomain: subDomain,
                  domain: domain,
                  zoneId: res?.data?.result[0]?.id
                })
                setSavedZone({
                  domain: subDomain,
                  subDomain: domain,
                  zoneID: res?.data?.result[0]?.id
                });
                setZoneId(res?.data?.result[0]?.id);
                setZoneDisabled(true);
                alert('Zone ' + res?.data?.result[0].name + ' is active.');
              }
            })
          }}>
          {zoneDisabled ? 'Stored Zone is verified' :'Verify zone and Save'}
        </Button>
        <Button
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
          style={styles.buttonStyle}
          mode="contained"
          onPress={async () => {
            getAllRecords(cfKey, zoneId, subDomain, function(err, res){
              if(err){
                console.log(err)
                alert('There is a problem loading Records!');
              }
              else {
                setIps(res?.data?.result)
              }
            })
          }}>
          Zone Records &nbsp;
          <SimpleLineIcons 
            name="refresh" 
            size={15} 
            color="white"
            style={{
              paddingLeft: 15,
              marginTop: 5
            }} />
        </Button>
        {ips.length > 0 && <View>
          <Text>
            IP(s):
          </Text>
          <FlatList
            data={ips}
            ListHeaderComponent={ListHeader}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        </View>}
        <Text
          style={{marginTop: 10}}
        >
          Add IP:
        </Text>
        <TextInput
          style={styles.input}
          value={ipAdd}
          onChangeText={(val) => setIpAdd(val)}
        >
        </TextInput>
        <Button
          contentStyle={{ ...styles.paperBtnContent }}
          labelStyle={{ ...miniStyle.textStyle }}
          style={styles.buttonStyle}
          mode="contained"
          onPress={() => {
            addRecord(cfKey, zoneId, ipAdd, subDomain, function(err, res){
              if(err){
                alert(JSON.stringify(err?.message));
              }
              else{
                setIps([res?.data?.result, ...ips]);
              }
            })
          }}
          >
            Add IP
          </Button>
          {/*<Button
            onPress={() => {
              getStoredJson('zone', {}).then(res => {
                console.log(res);
              })
            }}
            >
            show
          </Button>*/}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  list: {
    flex: 1,
    flexDirection: "column",
  },
  item: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: '#aaa'
  },
  paperBtnContent: { marginHorizontal: -10, marginVertical: -2 },
  buttonStyle: {
    marginTop: 5,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    //width: 300,
    marginHorizontal: 10,
    borderRadius: 5
  },
  verified: {
    borderWidth: 2,
    borderRadius: 5,
    borderColor: 'lightgreen'
  }
});
