import { LevelDB } from "./leveldb"
import WriteStream from 'level-ws'
const passwordHash = require('password-hash');


export class UserHandler {
    public db: any

    constructor(path: string) {
        this.db = LevelDB.open(path)
    }
    
    public get(username: string, callback: (err: Error | null, result?: User) => void) {
        this.db.get(`user:${username}`, function (err: Error, data: any) {
            if (err) callback(err)
            else if (data === undefined) {
                callback(null, data)
            }else{
                callback(null, User.fromDb(username, data))
            }
        })
    }

    public save(user: User, callback: (err: Error | null) => void) {
        // Takes a user, then adds user to database with username as key, then "password":"email" as value
        this.db.put(`user:${user.username}`, `${user.getPassword()}:${user.email}`, (err: Error | null) => {
            if (err) callback(err);
            else callback(null);
        })
    }

    public delete(username: string, callback: (err: Error | null) => void) {
        // Takes a username, and deletes user corresponding to the username from database
        this.db.del(`user:${username}`, (err: Error | null) => {
            if (err) callback(err);
            else callback(null);
        })
    }

    public getAllUsernames(callback: (error: Error | null, result: any) => void) {
        let usernames: string[] = []
        const stream = this.db.createReadStream()
            .on('data', function (data) {
                let username: string = data.key.split(':')[1];
                usernames.push(username);
            })
            .on('error', function (err) {
                callback(err, null);
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                callback(null, usernames)
                console.log('Stream ended')
            })
    }

}

export class User {
    public username: string
    public email: string
    private password: string = ""

    constructor(username: string, email: string, password: string, passwordHashed: boolean = false) {
        this.username = username
        this.email = email

        if (!passwordHashed) {
            this.setPassword(password)
        } else this.password = password
    }

    static fromDb(username: string, value: any): User {
        const [password, email] = value.split(":")
        return new User(username, email, password, passwordHash.isHashed(password))
    }

    public setPassword(toSet: string): void {
        // Hashes input password, then 
        this.password = passwordHash.generate(toSet);
    }

    public getPassword(): string {
        // returns the hashed password
        return this.password;
    }

    public validatePassword(toValidate: String): boolean {
        // return comparison with hashed password
        return passwordHash.verify(toValidate, this.password);
    }
}